import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/dashboard/widgets/exam_countdown_ticker.dart';

void main() {
  final today = DateTime(2026, 9, 3);

  testWidgets('renders nothing when no date is set', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExamCountdownTicker(assessmentDate: null, now: today),
        ),
      ),
    );

    expect(find.byType(ExamCountdownTicker), findsOneWidget);
    expect(find.byType(Icon), findsNothing);
  });

  testWidgets('shows the correct day count for a future date', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExamCountdownTicker(
            assessmentDate: DateTime(2026, 9, 13),
            now: today,
          ),
        ),
      ),
    );

    expect(find.textContaining('10', findRichText: true), findsOneWidget);
    expect(
      find.textContaining('days to your exam', findRichText: true),
      findsOneWidget,
    );
  });

  testWidgets('uses singular "day" when exactly 1 day remains', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExamCountdownTicker(
            assessmentDate: DateTime(2026, 9, 4),
            now: today,
          ),
        ),
      ),
    );

    expect(
      find.textContaining('day to your exam', findRichText: true),
      findsOneWidget,
    );
    expect(
      find.textContaining('days to your exam', findRichText: true),
      findsNothing,
    );
  });

  testWidgets('shows a same-day message when the exam is today', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExamCountdownTicker(assessmentDate: today, now: today),
        ),
      ),
    );

    expect(
      find.textContaining('is your exam day', findRichText: true),
      findsOneWidget,
    );
  });

  testWidgets('shows a past-date message without a negative day count', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExamCountdownTicker(
            assessmentDate: DateTime(2026, 8, 20),
            now: today,
          ),
        ),
      ),
    );

    expect(
      find.textContaining('Exam date passed', findRichText: true),
      findsOneWidget,
    );
    expect(find.textContaining('-', findRichText: true), findsNothing);
  });
}
