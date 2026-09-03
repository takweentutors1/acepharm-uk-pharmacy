import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/progress/mastery_status.dart';
import 'package:mobile_app/features/progress/progress_metrics.dart';
import 'package:mobile_app/features/progress/widgets/mastery_grid.dart';

const _allStatusesCategory = CategoryCoverage(
  categoryId: 'cat-1',
  categoryName: 'Cardiovascular Therapeutics',
  totalQuestions: 120,
  attemptedQuestions: 60,
  subtopics: [
    SubtopicMastery(
      id: 'sub-1',
      name: 'Heart Failure',
      total: 20,
      attempted: 0,
      coveragePercentage: 0,
      firstPassAccuracy: 0,
      status: MasteryStatus.notStarted,
    ),
    SubtopicMastery(
      id: 'sub-2',
      name: 'Hypertension',
      total: 20,
      attempted: 20,
      coveragePercentage: 100,
      firstPassAccuracy: 82,
      status: MasteryStatus.firstPass,
    ),
    SubtopicMastery(
      id: 'sub-3',
      name: 'Arrhythmias',
      total: 20,
      attempted: 10,
      coveragePercentage: 50,
      firstPassAccuracy: 40,
      status: MasteryStatus.needsAttention,
    ),
    SubtopicMastery(
      id: 'sub-4',
      name: 'Anticoagulation',
      total: 20,
      attempted: 12,
      coveragePercentage: 60,
      firstPassAccuracy: 78,
      status: MasteryStatus.developing,
    ),
    SubtopicMastery(
      id: 'sub-5',
      name: 'Lipid Management',
      total: 20,
      attempted: 20,
      coveragePercentage: 100,
      firstPassAccuracy: 90,
      status: MasteryStatus.secure,
    ),
    SubtopicMastery(
      id: 'sub-6',
      name: 'Antiplatelets',
      total: 20,
      attempted: 20,
      coveragePercentage: 100,
      firstPassAccuracy: 85,
      status: MasteryStatus.dueForReview,
    ),
  ],
);

void main() {
  testWidgets(
    'shows the category header and topic count, collapsed by default',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: MasteryGrid(categories: [_allStatusesCategory])),
        ),
      );

      expect(find.text('Curriculum Mastery (6 topics)'), findsOneWidget);
      expect(find.text('Cardiovascular Therapeutics'), findsOneWidget);
      expect(find.text('60/120 questions attempted'), findsOneWidget);
      // Collapsed: subtopic rows aren't built yet.
      expect(find.text('Heart Failure'), findsNothing);
    },
  );

  testWidgets('expanding a category reveals all 6 status labels', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: MasteryGrid(categories: [_allStatusesCategory])),
      ),
    );

    await tester.tap(find.text('Cardiovascular Therapeutics'));
    await tester.pumpAndSettle();

    expect(find.text('Heart Failure'), findsOneWidget);
    expect(find.text('Not started'), findsOneWidget);
    expect(find.text('First pass'), findsOneWidget);
    expect(find.text('Needs attention'), findsOneWidget);
    expect(find.text('Developing'), findsOneWidget);
    expect(find.text('Secure'), findsOneWidget);
    expect(find.text('Due for review'), findsOneWidget);
  });

  testWidgets('skips categories that have no subtopics', (tester) async {
    const emptyCategory = CategoryCoverage(
      categoryId: 'cat-2',
      categoryName: 'Empty Category',
      totalQuestions: 0,
      attemptedQuestions: 0,
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: MasteryGrid(categories: [emptyCategory])),
      ),
    );

    expect(find.text('Curriculum Mastery (0 topics)'), findsOneWidget);
    expect(find.text('Empty Category'), findsNothing);
  });
}
