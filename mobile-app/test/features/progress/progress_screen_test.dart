import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/progress/progress_metrics.dart';
import 'package:mobile_app/features/progress/progress_repository.dart';
import 'package:mobile_app/features/progress/progress_screen.dart';

class _FakeProgressRepository extends ProgressRepository {
  _FakeProgressRepository(this._result) : super(Dio());

  final Future<ProgressMetrics> Function() _result;
  int callCount = 0;

  @override
  Future<ProgressMetrics> fetchMetrics() {
    callCount++;
    return _result();
  }
}

const _metrics = ProgressMetrics(
  firstAttempt: AccuracyBucket(total: 40, correct: 22, percentage: 55),
  practice: AccuracyBucket(total: 90, correct: 63, percentage: 70),
  repeat: AccuracyBucket(total: 20, correct: 16, percentage: 80),
  lowConfidence: ConfidenceBucket(total: 10, correct: 8, accuracy: 80),
  mediumConfidence: ConfidenceBucket(total: 30, correct: 20, accuracy: 67),
  highConfidence: ConfidenceBucket(total: 15, correct: 6, accuracy: 40),
  calibrationSummary: CalibrationSummary.overconfident,
  categoryCoverage: [
    CategoryCoverage(
      categoryId: 'cat-1',
      categoryName: 'Cardiovascular Therapeutics',
      totalQuestions: 50,
      attemptedQuestions: 30,
    ),
    CategoryCoverage(
      categoryId: 'cat-2',
      categoryName: 'Respiratory Therapeutics',
      totalQuestions: 50,
      attemptedQuestions: 10,
    ),
  ],
);

void main() {
  testWidgets('renders all five pillars as distinct, unmerged figures', (
    tester,
  ) async {
    final repo = _FakeProgressRepository(() async => _metrics);

    await tester.pumpWidget(
      MaterialApp(home: ProgressScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    // Pillar 1: First-attempt accuracy
    expect(find.text('First-Attempt Accuracy'), findsOneWidget);
    expect(find.text('55%'), findsOneWidget);

    // Pillar 2: Practice accuracy — a different number, never merged.
    expect(find.text('Practice Accuracy'), findsOneWidget);
    expect(find.text('70%'), findsOneWidget);

    // Pillar 3: Repeat accuracy — a third, distinct number.
    expect(find.text('Repeat Accuracy'), findsOneWidget);
    expect(find.text('80%'), findsOneWidget);

    // Pillar 4: Confidence calibration grid + verdict.
    expect(find.text('Confidence Calibration'), findsOneWidget);
    expect(find.text('Overconfident'), findsOneWidget);
    expect(find.text('80% accurate'), findsOneWidget);
    expect(find.text('67% accurate'), findsOneWidget);
    expect(find.text('40% accurate'), findsOneWidget);

    // Pillar 5: Curriculum coverage — (30+10)/(50+50) = 40%.
    expect(find.text('Curriculum Coverage'), findsOneWidget);
    expect(find.text('40%'), findsOneWidget);
  });

  testWidgets('shows Calibrated with a success badge when balanced', (
    tester,
  ) async {
    final repo = _FakeProgressRepository(
      () async => const ProgressMetrics(
        firstAttempt: AccuracyBucket(total: 10, correct: 5, percentage: 50),
        practice: AccuracyBucket(total: 10, correct: 5, percentage: 50),
        repeat: AccuracyBucket(total: 0, correct: 0, percentage: 0),
        lowConfidence: ConfidenceBucket(total: 0, correct: 0, accuracy: 0),
        mediumConfidence: ConfidenceBucket(total: 0, correct: 0, accuracy: 0),
        highConfidence: ConfidenceBucket(total: 0, correct: 0, accuracy: 0),
        calibrationSummary: CalibrationSummary.calibrated,
        categoryCoverage: [],
      ),
    );

    await tester.pumpWidget(
      MaterialApp(home: ProgressScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Calibrated'), findsOneWidget);
    expect(find.text('No attempts'), findsNWidgets(3));
  });

  testWidgets('shows an error state with a working retry button', (
    tester,
  ) async {
    var shouldFail = true;
    final repo = _FakeProgressRepository(() async {
      if (shouldFail) throw DioException(requestOptions: RequestOptions());
      return _metrics;
    });

    await tester.pumpWidget(
      MaterialApp(home: ProgressScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(find.text("Couldn't load your progress."), findsOneWidget);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('First-Attempt Accuracy'), findsOneWidget);
    expect(repo.callCount, 2);
  });
}
