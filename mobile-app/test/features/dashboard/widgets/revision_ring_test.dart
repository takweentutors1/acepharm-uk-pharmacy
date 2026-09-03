import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/dashboard/widgets/revision_ring.dart';

void main() {
  Future<void> pumpRing(
    WidgetTester tester, {
    required int completed,
    required int target,
  }) {
    return tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: RevisionRing(completed: completed, target: target),
        ),
      ),
    );
  }

  testWidgets('renders the completed/target fraction as text', (tester) async {
    await pumpRing(tester, completed: 14, target: 20);
    await tester.pumpAndSettle();

    expect(find.text('14/20', findRichText: true), findsOneWidget);
    expect(find.text('completed today'), findsOneWidget);
    expect(find.text('Goal complete'), findsNothing);
  });

  testWidgets('shows the multi-cue complete state at target', (tester) async {
    await pumpRing(tester, completed: 20, target: 20);
    await tester.pumpAndSettle();

    expect(find.text('Goal complete'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
  });

  testWidgets('does not divide by zero when target is 0', (tester) async {
    await pumpRing(tester, completed: 0, target: 0);
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('0/0', findRichText: true), findsOneWidget);
  });

  testWidgets('clamps progress when completed exceeds target', (tester) async {
    await pumpRing(tester, completed: 25, target: 20);
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Goal complete'), findsOneWidget);
  });
}
