import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/user/university.dart';
import 'package:mobile_app/features/onboarding/onboarding_flow_screen.dart';
import 'package:mobile_app/features/onboarding/onboarding_repository.dart';
import 'package:mobile_app/features/onboarding/training_stage.dart';

class _FakeOnboardingRepository extends OnboardingRepository {
  _FakeOnboardingRepository({this.fail = false}) : super(Dio());

  final bool fail;
  TrainingStage? submittedStage;
  String? submittedGoal;
  int? submittedDailyTarget;

  @override
  Future<List<University>> fetchUniversities() async => const [];

  @override
  Future<void> submit({
    required TrainingStage stage,
    required String primaryGoal,
    DateTime? assessmentDate,
    required int dailyQuestionTarget,
    String? universityId,
  }) async {
    if (fail) throw DioException(requestOptions: RequestOptions());
    submittedStage = stage;
    submittedGoal = primaryGoal;
    submittedDailyTarget = dailyQuestionTarget;
  }
}

Future<void> _pumpFlow(
  WidgetTester tester,
  OnboardingRepository repository, {
  VoidCallback? onComplete,
}) {
  return tester.pumpWidget(
    MaterialApp(
      home: OnboardingFlowScreen(
        onboardingRepository: repository,
        onComplete: onComplete ?? () {},
      ),
    ),
  );
}

void main() {
  testWidgets('Continue stays disabled until a training stage is picked', (
    tester,
  ) async {
    await _pumpFlow(tester, _FakeOnboardingRepository());
    await tester.pumpAndSettle();

    final continueButton = find.widgetWithText(ElevatedButton, 'Continue');
    expect(tester.widget<ElevatedButton>(continueButton).onPressed, isNull);

    await tester.tap(find.text('Foundation Trainee'));
    await tester.pump();

    expect(tester.widget<ElevatedButton>(continueButton).onPressed, isNotNull);
  });

  testWidgets('the back button returns to the previous step', (tester) async {
    await _pumpFlow(tester, _FakeOnboardingRepository());
    await tester.pumpAndSettle();

    await tester.tap(find.text('MPharm Year 3'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Step 2 of 5'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.arrow_back));
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 5'), findsOneWidget);
    // Selection is preserved when navigating back.
    final selectedCard = find.text('MPharm Year 3');
    expect(selectedCard, findsOneWidget);
  });

  testWidgets('the "Other" goal requires custom text before continuing', (
    tester,
  ) async {
    await _pumpFlow(tester, _FakeOnboardingRepository());
    await tester.pumpAndSettle();

    await tester.tap(find.text('MPharm Year 2'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Step 2 of 5'), findsOneWidget);

    await tester.tap(find.text('Other'));
    await tester.pump();

    final continueButton = find.widgetWithText(ElevatedButton, 'Continue');
    expect(tester.widget<ElevatedButton>(continueButton).onPressed, isNull);

    await tester.enterText(
      find.widgetWithText(TextFormField, "Tell us what you're revising for"),
      'Local hospital trust induction exam',
    );
    await tester.pump();

    expect(tester.widget<ElevatedButton>(continueButton).onPressed, isNotNull);
  });

  testWidgets('the daily goal stepper respects its min and max bounds', (
    tester,
  ) async {
    await _pumpFlow(tester, _FakeOnboardingRepository());
    await tester.pumpAndSettle();

    await tester.tap(find.text('MPharm Year 2'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('GPhC Registration Assessment'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue')); // skip exam date
    await tester.pumpAndSettle();

    expect(find.text('20'), findsOneWidget); // default

    for (var i = 0; i < 3; i++) {
      await tester.tap(find.byIcon(Icons.remove));
      await tester.pump();
    }
    expect(find.text('5'), findsOneWidget);

    // At the floor — further taps must not go negative.
    await tester.tap(find.byIcon(Icons.remove));
    await tester.pump();
    expect(find.text('5'), findsOneWidget);

    for (var i = 0; i < 19; i++) {
      await tester.tap(find.byIcon(Icons.add));
      await tester.pump();
    }
    expect(find.text('100'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();
    expect(find.text('100'), findsOneWidget); // at the ceiling
  });

  testWidgets('shows an inline error and stays retriable if submit fails', (
    tester,
  ) async {
    await _pumpFlow(tester, _FakeOnboardingRepository(fail: true));
    await tester.pumpAndSettle();

    await tester.tap(find.text('MPharm Year 4'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('MPharm Progression Exams'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue')); // skip exam date
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue')); // keep default daily goal
    await tester.pumpAndSettle();

    await tester.tap(find.text('Finish'));
    await tester.pumpAndSettle();

    expect(find.text("Couldn't save your answers. Try again."), findsOneWidget);
    // Still on step 5 — not stuck mid-submit, can retry.
    expect(find.text('Step 5 of 5'), findsOneWidget);
  });

  testWidgets('submits the collected answers on Finish', (tester) async {
    // 'Independent Prescribing (IP)' is the 6th/last stage card — outside
    // the default 600px test viewport's ListView build extent.
    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final repo = _FakeOnboardingRepository();
    var completed = false;

    await _pumpFlow(tester, repo, onComplete: () => completed = true);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Independent Prescribing (IP)'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OSCE / Practical Assessment'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.add)); // 25
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Finish'));
    await tester.pumpAndSettle();

    expect(completed, isTrue);
    expect(repo.submittedStage, TrainingStage.ip);
    expect(repo.submittedGoal, 'OSCE / Practical Assessment');
    expect(repo.submittedDailyTarget, 25);
  });
}
