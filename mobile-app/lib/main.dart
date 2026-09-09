import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/api/api_client.dart';
import 'core/curriculum/curriculum_repository.dart';
import 'core/theme/ace_theme.dart';
import 'core/user/user_repository.dart';
import 'features/account/account_repository.dart';
import 'features/auth/auth_repository.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/dashboard/daily_goal_repository.dart';
import 'features/dashboard/recommendation_repository.dart';
import 'features/dashboard/weekly_insight_repository.dart';
import 'features/onboarding/onboarding_gate.dart';
import 'features/onboarding/onboarding_repository.dart';
import 'features/practice/ace_repository.dart';
import 'features/practice/question_repository.dart';
import 'features/practice/session_repository.dart';
import 'features/progress/progress_repository.dart';
import 'features/subscription/subscription_repository.dart';
import 'firebase_options.dart';

void main() {
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      // Local store for the offline answer queue (Product Invariant #6) —
      // pure Dart file storage, no platform init beyond this call.
      await Hive.initFlutter();

      // Crash reporting is off in debug — dev exceptions shouldn't pollute
      // production crash-free-user metrics.
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(
        kReleaseMode,
      );
      FlutterError.onError =
          FirebaseCrashlytics.instance.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };

      runApp(const MainApp());
    },
    (error, stack) =>
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true),
  );
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(theme: AceTheme.light, home: const _AuthGate());
  }
}

/// Routes to [LoginScreen] when signed out, or [OnboardingGate] (which
/// itself routes to onboarding or the dashboard) once a session exists.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  final _authRepository = AuthRepository();

  // Attempts a silent resume from the stored refresh token exactly once,
  // before the first frame — not in build(), so it isn't re-triggered on
  // every rebuild.
  late final Future<bool> _restoreSessionFuture =
      _authRepository.restoreSession();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _restoreSessionFuture,
      builder: (context, restoreSnapshot) {
        if (restoreSnapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return StreamBuilder<bool>(
          // authStateChanges doesn't replay its last value to new
          // subscribers, so the resolved restoreSession() result seeds the
          // first frame; live sign-in/sign-out events update it after that.
          initialData: restoreSnapshot.data ?? false,
          stream: _authRepository.authStateChanges,
          builder: (context, snapshot) {
            if (snapshot.data != true) {
              return LoginScreen(authRepository: _authRepository);
            }

            // If a request is rejected even after a token refresh retry, the
            // session itself is invalid (not just stale) — sign out so
            // `authStateChanges` above flips to false and this StreamBuilder
            // falls back to LoginScreen, instead of leaving the user stuck
            // on a screen that can never successfully load again.
            final dio =
                ApiClient(onUnauthenticated: _authRepository.signOut).dio;
            return OnboardingGate(
              userRepository: UserRepository(dio),
              onboardingRepository: OnboardingRepository(dio),
              builder: (context, profile) => DashboardScreen(
                profile: profile,
                dailyGoalRepository: DailyGoalRepository(dio),
                weeklyInsightRepository: WeeklyInsightRepository(dio),
                recommendationRepository: RecommendationRepository(dio),
                curriculumRepository: CurriculumRepository(dio),
                sessionRepository: SessionRepository(dio),
                questionRepository: QuestionRepository(dio),
                aceRepository: AceRepository(dio),
                progressRepository: ProgressRepository(dio),
                subscriptionRepository: SubscriptionRepository(dio),
                accountRepository: AccountRepository(dio),
              ),
            );
          },
        );
      },
    );
  }
}
