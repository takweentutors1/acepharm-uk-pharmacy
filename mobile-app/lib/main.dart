import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'core/api/api_client.dart';
import 'core/curriculum/curriculum_repository.dart';
import 'core/theme/ace_theme.dart';
import 'core/user/user_repository.dart';
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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(theme: AceTheme.light, home: const _AuthGate());
  }
}

/// Routes to [LoginScreen] when signed out, or [OnboardingGate] (which
/// itself routes to onboarding or the dashboard) once a Firebase user
/// session exists.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final authRepository = AuthRepository();
    return StreamBuilder<User?>(
      stream: authRepository.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.data == null) {
          return LoginScreen(authRepository: authRepository);
        }

        final dio = ApiClient().dio;
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
          ),
        );
      },
    );
  }
}
