import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/user/university.dart';
import 'package:mobile_app/core/user/user_profile.dart';
import 'package:mobile_app/core/user/user_repository.dart';
import 'package:mobile_app/features/onboarding/onboarding_gate.dart';
import 'package:mobile_app/features/onboarding/onboarding_repository.dart';
import 'package:mobile_app/features/onboarding/training_stage.dart';

class _FakeUserRepository extends UserRepository {
  _FakeUserRepository(this._profile) : super(Dio());

  UserProfile? _profile;
  int callCount = 0;

  @override
  Future<UserProfile> fetchMe() async {
    callCount++;
    if (_profile == null) throw DioException(requestOptions: RequestOptions());
    return _profile!;
  }

  void completeOnboarding() {
    _profile = UserProfile(
      id: _profile!.id,
      email: _profile!.email,
      hasCompletedOnboarding: true,
    );
  }
}

class _FakeOnboardingRepository extends OnboardingRepository {
  _FakeOnboardingRepository() : super(Dio());

  @override
  Future<List<University>> fetchUniversities() async => const [];

  @override
  Future<void> submit({
    required TrainingStage stage,
    required String primaryGoal,
    DateTime? assessmentDate,
    required int dailyQuestionTarget,
    String? universityId,
  }) async {}
}

void main() {
  testWidgets('shows onboarding when the profile has not completed it', (
    tester,
  ) async {
    final users = _FakeUserRepository(
      const UserProfile(id: 'u1', email: 'a@b.com'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: OnboardingGate(
          userRepository: users,
          onboardingRepository: _FakeOnboardingRepository(),
          builder: (context, profile) =>
              const Scaffold(body: Text('DASHBOARD')),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 5'), findsOneWidget);
    expect(find.text('DASHBOARD'), findsNothing);
  });

  testWidgets('goes straight to the builder content when already onboarded', (
    tester,
  ) async {
    final users = _FakeUserRepository(
      const UserProfile(
        id: 'u1',
        email: 'a@b.com',
        hasCompletedOnboarding: true,
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: OnboardingGate(
          userRepository: users,
          onboardingRepository: _FakeOnboardingRepository(),
          builder: (context, profile) =>
              Scaffold(body: Text('DASHBOARD for ${profile?.id}')),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('DASHBOARD for u1'), findsOneWidget);
    expect(find.text('Step 1 of 5'), findsNothing);
  });

  testWidgets(
    'fails open to builder content (null profile) if the fetch fails',
    (tester) async {
      final users = _FakeUserRepository(null);

      await tester.pumpWidget(
        MaterialApp(
          home: OnboardingGate(
            userRepository: users,
            onboardingRepository: _FakeOnboardingRepository(),
            builder: (context, profile) => Text('BUILDER ${profile == null}'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('BUILDER true'), findsOneWidget);
      expect(find.text('Step 1 of 5'), findsNothing);
    },
  );

  testWidgets('finishing onboarding re-fetches and swaps to builder content', (
    tester,
  ) async {
    final users = _FakeUserRepository(
      const UserProfile(id: 'u1', email: 'a@b.com'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: OnboardingGate(
          userRepository: users,
          onboardingRepository: _FakeOnboardingRepository(),
          builder: (context, profile) =>
              const Scaffold(body: Text('DASHBOARD')),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Step 1 of 5'), findsOneWidget);

    // Complete step 1 (training stage).
    await tester.tap(find.text('MPharm Year 2'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // Complete step 2 (primary goal).
    await tester.tap(find.text('GPhC Registration Assessment'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // Steps 3 and 4 are optional — continue through.
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // Step 5 is optional — flip the fake's profile, then finish.
    users.completeOnboarding();
    await tester.tap(find.text('Finish'));
    await tester.pumpAndSettle();

    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('Step 1 of 5'), findsNothing);
    expect(users.callCount, 2);
  });
}
