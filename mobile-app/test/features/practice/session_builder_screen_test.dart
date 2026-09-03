import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/curriculum/category.dart';
import 'package:mobile_app/core/curriculum/curriculum_repository.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/practice/practice_session.dart';
import 'package:mobile_app/features/practice/session_builder_query.dart';
import 'package:mobile_app/features/practice/session_builder_screen.dart';
import 'package:mobile_app/features/practice/session_mode.dart';
import 'package:mobile_app/features/practice/session_repository.dart';

class _FakeCurriculumRepository extends CurriculumRepository {
  _FakeCurriculumRepository(this._categories) : super(Dio());

  final List<Category> _categories;

  @override
  Future<List<Category>> fetchCategories({String? pathwayId}) async =>
      _categories;
}

class _FakeSessionRepository extends SessionRepository {
  _FakeSessionRepository({this.failCreate = false}) : super(Dio());

  bool failCreate;
  final List<SessionBuilderQuery> estimateCalls = [];
  final List<SessionBuilderQuery> createCalls = [];

  @override
  Future<int> estimateAvailableCount(SessionBuilderQuery query) async {
    estimateCalls.add(query);
    return 10;
  }

  @override
  Future<PracticeSession> create(SessionBuilderQuery query) async {
    createCalls.add(query);
    if (failCreate) {
      throw DioException(requestOptions: RequestOptions());
    }
    return const PracticeSession(
      sessionId: 'session-1',
      mode: SessionMode.learn,
      totalQuestions: 10,
      questions: [],
    );
  }
}

final _categories = List.generate(
  19,
  (i) => Category(
    id: 'cat-$i',
    pathwayId: 'pathway-1',
    name: 'Domain ${i + 1}',
    code: 'GPHC-${i + 1}',
  ),
);

/// The builder debounces estimate calls by 400ms via a plain [Timer], which
/// `pumpAndSettle()` does *not* wait for (a dangling Timer doesn't count as
/// a scheduled frame, so it settles almost immediately). Advance the fake
/// clock past the debounce window explicitly instead.
Future<void> pumpPastDebounce(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
}

void main() {
  testWidgets('defaults to all 19 domains selected and Learn mode', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
        ),
      ),
    );
    await pumpPastDebounce(tester);

    expect(find.text('Curriculum (19/19 domains)'), findsOneWidget);
    expect(find.text('Clear all'), findsOneWidget);
    expect(sessions.estimateCalls.single.categoryIds, isEmpty);
    expect(sessions.estimateCalls.single.mode, SessionMode.learn);
  });

  testWidgets('deselecting a domain debounces and re-estimates', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
        ),
      ),
    );
    await pumpPastDebounce(tester);
    expect(sessions.estimateCalls.length, 1);

    await tester.tap(find.text('Domain 1'));
    await tester.pump(const Duration(milliseconds: 100));
    // Still within the debounce window — no second call yet.
    expect(sessions.estimateCalls.length, 1);

    await tester.pump(const Duration(milliseconds: 400));
    expect(sessions.estimateCalls.length, 2);
    expect(sessions.estimateCalls.last.categoryIds, hasLength(18));
    expect(find.text('Curriculum (18/19 domains)'), findsOneWidget);
  });

  testWidgets('disables Start session when no domain is selected', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
        ),
      ),
    );
    await pumpPastDebounce(tester);

    await tester.tap(find.text('Clear all'));
    await tester.pump();

    expect(
      find.text('Select at least one domain to continue.'),
      findsOneWidget,
    );
    final button = tester.widget<AceButton>(find.byType(AceButton));
    expect(button.onPressed, isNull);
  });

  testWidgets('switching to Timed Exam mode re-estimates with the new mode', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
        ),
      ),
    );
    await pumpPastDebounce(tester);

    await tester.tap(find.text('Timed Exam Mode'));
    await pumpPastDebounce(tester);

    expect(sessions.estimateCalls.last.mode, SessionMode.timed);
  });

  testWidgets('starting a session invokes onSessionCreated on success', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository();
    PracticeSession? created;

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
          onSessionCreated: (s) => created = s,
        ),
      ),
    );
    await pumpPastDebounce(tester);

    await tester.tap(find.text('Start session'));
    await tester.pumpAndSettle();

    expect(created?.sessionId, 'session-1');
  });

  testWidgets('shows an inline error and stays usable if create fails', (
    tester,
  ) async {
    final curriculum = _FakeCurriculumRepository(_categories);
    final sessions = _FakeSessionRepository(failCreate: true);

    await tester.pumpWidget(
      MaterialApp(
        home: SessionBuilderScreen(
          curriculumRepository: curriculum,
          sessionRepository: sessions,
        ),
      ),
    );
    await pumpPastDebounce(tester);

    await tester.tap(find.text('Start session'));
    await tester.pumpAndSettle();

    expect(find.text("Couldn't start the session. Try again."), findsOneWidget);
  });
}
