import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/dashboard/recommendation.dart';
import 'package:mobile_app/features/dashboard/recommendation_repository.dart';
import 'package:mobile_app/features/dashboard/widgets/recommendation_card.dart';

class _FakeRecommendationRepository extends RecommendationRepository {
  _FakeRecommendationRepository(this._result) : super(Dio());

  final Future<Recommendation> Function() _result;
  int callCount = 0;

  @override
  Future<Recommendation> fetch() {
    callCount++;
    return _result();
  }
}

const _weakAccuracyRecommendation = Recommendation(
  reason: RecommendationReason.weakAccuracy,
  reasonText:
      'Recommended because your first-attempt accuracy in Cardiovascular '
      'Therapeutics is 44%.',
  subtopicId: 'sub-1',
  subtopicName: 'Cardiovascular Therapeutics',
  categoryName: 'Clinical Therapeutics',
  availableUnseenCount: 12,
  totalQuestionsInSubtopic: 40,
  attemptsCount: 9,
  recommendedQuestionCount: 10,
  accuracyPercentage: 44,
);

void main() {
  testWidgets('shows a loading state before the fetch resolves', (
    tester,
  ) async {
    final repo = _FakeRecommendationRepository(
      () => Future.delayed(
        const Duration(seconds: 1),
        () => _weakAccuracyRecommendation,
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: RecommendationCard(repository: repo)),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets('always renders the reasonText alongside the recommendation', (
    tester,
  ) async {
    final repo = _FakeRecommendationRepository(
      () async => _weakAccuracyRecommendation,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: RecommendationCard(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Cardiovascular Therapeutics'), findsOneWidget);
    expect(
      find.text(
        'Recommended because your first-attempt accuracy in Cardiovascular '
        'Therapeutics is 44%.',
      ),
      findsOneWidget,
    );
    expect(find.text('Focus area'), findsOneWidget);
    expect(
      find.text('Start session · 10 questions', findRichText: true),
      findsOneWidget,
    );
  });

  testWidgets('invokes onStartSession with the recommendation on tap', (
    tester,
  ) async {
    final repo = _FakeRecommendationRepository(
      () async => _weakAccuracyRecommendation,
    );
    Recommendation? tapped;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: RecommendationCard(
            repository: repo,
            onStartSession: (r) => tapped = r,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(
      find.text('Start session · 10 questions', findRichText: true),
    );
    await tester.pump();

    expect(tapped, same(_weakAccuracyRecommendation));
  });

  testWidgets('fails closed to an error state — never an unexplained card', (
    tester,
  ) async {
    var shouldFail = true;
    final repo = _FakeRecommendationRepository(() async {
      if (shouldFail) throw DioException(requestOptions: RequestOptions());
      return _weakAccuracyRecommendation;
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: RecommendationCard(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining("Couldn't load"), findsOneWidget);
    expect(find.textContaining('Recommended because'), findsNothing);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('Cardiovascular Therapeutics'), findsOneWidget);
    expect(repo.callCount, 2);
  });
}
