import 'package:flutter/material.dart';

import '../../core/curriculum/curriculum_repository.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/user/user_profile.dart';
import '../../core/widgets/widgets.dart';
import '../account/account_repository.dart';
import '../account/settings_screen.dart';
import '../auth/auth_repository.dart';
import '../practice/ace_repository.dart';
import '../practice/practice_session_player.dart';
import '../practice/question_repository.dart';
import '../practice/session_builder_screen.dart';
import '../practice/session_repository.dart';
import '../progress/progress_repository.dart';
import '../progress/progress_screen.dart';
import '../subscription/subscription_repository.dart';
import '../subscription/subscription_status_screen.dart';
import 'daily_goal_repository.dart';
import 'recommendation_repository.dart';
import 'weekly_insight_repository.dart';
import 'widgets/daily_goal_ring.dart';
import 'widgets/exam_countdown_ticker.dart';
import 'widgets/recommendation_card.dart';
import 'widgets/weekly_insight_card.dart';

/// The signed-in home screen, shown once [OnboardingGate] has confirmed
/// onboarding is complete (or failed open). Wires Build a session →
/// answer every question → back to the dashboard as one connected flow.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({
    super.key,
    required this.profile,
    required this.dailyGoalRepository,
    required this.weeklyInsightRepository,
    required this.recommendationRepository,
    required this.curriculumRepository,
    required this.sessionRepository,
    required this.questionRepository,
    required this.aceRepository,
    required this.progressRepository,
    required this.subscriptionRepository,
    required this.accountRepository,
  });

  /// Resolved once upstream by `OnboardingGate`. Null only if that
  /// profile fetch itself failed — the dashboard degrades gracefully
  /// (non-personalised, no countdown ticker) rather than blocking.
  final UserProfile? profile;
  final DailyGoalRepository dailyGoalRepository;
  final WeeklyInsightRepository weeklyInsightRepository;
  final RecommendationRepository recommendationRepository;
  final CurriculumRepository curriculumRepository;
  final SessionRepository sessionRepository;
  final QuestionRepository questionRepository;
  final AceRepository aceRepository;
  final ProgressRepository progressRepository;
  final SubscriptionRepository subscriptionRepository;
  final AccountRepository accountRepository;

  void _openSessionBuilder(BuildContext context) {
    final userId = profile?.id;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SessionBuilderScreen(
          curriculumRepository: curriculumRepository,
          sessionRepository: sessionRepository,
          onSessionCreated: (session) {
            Navigator.of(context).pop();
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => PracticeSessionPlayer(
                  session: session,
                  sessionRepository: sessionRepository,
                  questionRepository: questionRepository,
                  aceRepository: aceRepository,
                  userId: userId,
                  onSessionComplete: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Session complete!')),
                    );
                  },
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openProgress(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProgressScreen(repository: progressRepository),
      ),
    );
  }

  void _openSubscription(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            SubscriptionStatusScreen(repository: subscriptionRepository),
      ),
    );
  }

  void _openSettings(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SettingsScreen(
          authRepository: AuthRepository(),
          accountRepository: accountRepository,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AcePharm'),
        actions: [
          IconButton(
            icon: const Icon(Icons.insights_outlined),
            tooltip: 'Progress',
            onPressed: () => _openProgress(context),
          ),
          IconButton(
            icon: const Icon(Icons.workspace_premium_outlined),
            tooltip: 'Subscription',
            onPressed: () => _openSubscription(context),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Settings',
            onPressed: () => _openSettings(context),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => AuthRepository().signOut(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AceSpacing.lg),
        children: [
          Center(child: DailyGoalRing(repository: dailyGoalRepository)),
          const SizedBox(height: AceSpacing.lg),
          ExamCountdownTicker(assessmentDate: profile?.assessmentDate),
          if (profile?.assessmentDate != null)
            const SizedBox(height: AceSpacing.lg),
          WeeklyInsightCard(
            repository: weeklyInsightRepository,
            userId: profile?.id,
          ),
          const SizedBox(height: AceSpacing.lg),
          RecommendationCard(
            repository: recommendationRepository,
            onStartSession: (_) => _openSessionBuilder(context),
          ),
          const SizedBox(height: AceSpacing.lg),
          AceButton(
            label: 'Build a session',
            onPressed: () => _openSessionBuilder(context),
          ),
        ],
      ),
    );
  }
}
