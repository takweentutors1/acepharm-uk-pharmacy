import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/dashboard/weekly_insight.dart';
import 'package:mobile_app/features/dashboard/weekly_insight_repository.dart';
import 'package:mobile_app/features/dashboard/widgets/weekly_insight_card.dart';

class _FakeWeeklyInsightRepository extends WeeklyInsightRepository {
  _FakeWeeklyInsightRepository(this._result) : super(Dio());

  final Future<WeeklyInsight> Function() _result;
  int callCount = 0;

  @override
  Future<WeeklyInsight> fetch({String? userId}) {
    callCount++;
    return _result();
  }
}

void main() {
  testWidgets('shows a loading state before the fetch resolves', (
    tester,
  ) async {
    final repo = _FakeWeeklyInsightRepository(
      () => Future.delayed(
        const Duration(seconds: 1),
        () => const WeeklyInsight(
          insightParagraph: 'Great work this week.',
          confidentlyIncorrectCount: 0,
          source: 'kv_cache',
        ),
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: WeeklyInsightCard(repository: repo)),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('renders the insight paragraph and review badge on success', (
    tester,
  ) async {
    final repo = _FakeWeeklyInsightRepository(
      () async => const WeeklyInsight(
        insightParagraph: 'You had 2 confidently-incorrect answers.',
        confidentlyIncorrectCount: 2,
        source: 'kv_cache',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: WeeklyInsightCard(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('You had 2 confidently-incorrect answers.'),
      findsOneWidget,
    );
    expect(find.text('2 to review', findRichText: true), findsOneWidget);
    expect(find.textContaining('unlock a personalised insight'), findsNothing);
  });

  testWidgets('shows the unpersonalised hint when source is default_empty', (
    tester,
  ) async {
    final repo = _FakeWeeklyInsightRepository(
      () async => const WeeklyInsight(
        insightParagraph: 'Complete your first practice sessions this week.',
        confidentlyIncorrectCount: 0,
        source: 'default_empty',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: WeeklyInsightCard(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.textContaining('unlock a personalised insight'),
      findsOneWidget,
    );
  });

  testWidgets('shows an error state with a working retry button', (
    tester,
  ) async {
    var shouldFail = true;
    final repo = _FakeWeeklyInsightRepository(() async {
      if (shouldFail) throw DioException(requestOptions: RequestOptions());
      return const WeeklyInsight(
        insightParagraph: 'Recovered insight.',
        confidentlyIncorrectCount: 0,
        source: 'kv_cache',
      );
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: WeeklyInsightCard(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining("Couldn't load"), findsOneWidget);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('Recovered insight.'), findsOneWidget);
    expect(repo.callCount, 2);
  });
}
