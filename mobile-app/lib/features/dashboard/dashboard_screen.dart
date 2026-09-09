import 'package:flutter/material.dart';

import '../../core/curriculum/curriculum_repository.dart';
import '../../core/offline/offline_answer_queue.dart';
import '../../core/offline/offline_answer_sync_service.dart';
import '../../core/theme/ace_colors.dart';
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
///
/// Also hosts the offline-answer sync listener for the whole authenticated
/// session: this screen stays mounted (just not visible) under everything
/// pushed on top of it, so a connectivity change is caught here and
/// flushed regardless of which screen the user is actually looking at.
class DashboardScreen extends StatefulWidget {
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
    this.offlineAnswerQueue,
    this.offlineAnswerSyncService,
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
  final OfflineAnswerQueue? offlineAnswerQueue;
  final OfflineAnswerSyncService? offlineAnswerSyncService;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final OfflineAnswerQueue _offlineAnswerQueue =
      widget.offlineAnswerQueue ?? OfflineAnswerQueue();
  late final OfflineAnswerSyncService _syncService =
      widget.offlineAnswerSyncService ??
      OfflineAnswerSyncService(
        queue: _offlineAnswerQueue,
        sessionRepository: widget.sessionRepository,
      );

  @override
  void initState() {
    super.initState();
    _syncService.start();
  }

  @override
  void dispose() {
    _syncService.dispose();
    super.dispose();
  }

  void _openSessionBuilder(BuildContext context) {
    final userId = widget.profile?.id;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SessionBuilderScreen(
          curriculumRepository: widget.curriculumRepository,
          sessionRepository: widget.sessionRepository,
          onSessionCreated: (session) {
            Navigator.of(context).pop();
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => PracticeSessionPlayer(
                  session: session,
                  sessionRepository: widget.sessionRepository,
                  questionRepository: widget.questionRepository,
                  aceRepository: widget.aceRepository,
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
        builder: (_) => ProgressScreen(repository: widget.progressRepository),
      ),
    );
  }

  void _openSubscription(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            SubscriptionStatusScreen(repository: widget.subscriptionRepository),
      ),
    );
  }

  void _openSettings(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SettingsScreen(
          authRepository: AuthRepository(),
          accountRepository: widget.accountRepository,
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
          StreamBuilder<int>(
            stream: _offlineAnswerQueue.watchCount(),
            builder: (context, snapshot) {
              final pendingCount = snapshot.data ?? 0;
              if (pendingCount == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(bottom: AceSpacing.lg),
                child: _PendingSyncBanner(count: pendingCount),
              );
            },
          ),
          Center(child: DailyGoalRing(repository: widget.dailyGoalRepository)),
          const SizedBox(height: AceSpacing.lg),
          ExamCountdownTicker(assessmentDate: widget.profile?.assessmentDate),
          if (widget.profile?.assessmentDate != null)
            const SizedBox(height: AceSpacing.lg),
          WeeklyInsightCard(
            repository: widget.weeklyInsightRepository,
            userId: widget.profile?.id,
          ),
          const SizedBox(height: AceSpacing.lg),
          RecommendationCard(
            repository: widget.recommendationRepository,
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

class _PendingSyncBanner extends StatelessWidget {
  const _PendingSyncBanner({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return AceCard(
      child: Row(
        children: [
          const Icon(Icons.cloud_sync_outlined, color: AceColors.slate),
          const SizedBox(width: AceSpacing.sm),
          Expanded(
            child: Text(
              count == 1
                  ? '1 answer will sync once you\'re back online'
                  : '$count answers will sync once you\'re back online',
              style: const TextStyle(color: AceColors.slate),
            ),
          ),
        ],
      ),
    );
  }
}
