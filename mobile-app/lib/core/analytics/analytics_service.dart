import 'package:firebase_analytics/firebase_analytics.dart';

/// Thin wrapper around [FirebaseAnalytics] — the single place event names
/// and parameter shapes are defined, so the app's funnel events (onboarding
/// drop-off, session/question activity, subscription and account actions)
/// stay consistent instead of ad hoc strings scattered across screens.
///
/// Every method is `Future<void>` and swallows nothing — callers fire these
/// with `unawaited(...)` since a dropped analytics event should never block
/// or fail a user-facing action.
class AnalyticsService {
  AnalyticsService({FirebaseAnalytics? analytics}) : _injected = analytics;

  final FirebaseAnalytics? _injected;

  /// Resolved lazily, not in the constructor — [FirebaseAnalytics.instance]
  /// requires `Firebase.initializeApp` to have run, which plain widget
  /// tests don't do. Subclasses that override every method touching this
  /// never trigger the lookup (see `test/core/analytics/`).
  FirebaseAnalytics get _analytics => _injected ?? FirebaseAnalytics.instance;

  Future<void> logSignUp() => _analytics.logSignUp(signUpMethod: 'email');

  Future<void> logLogin() => _analytics.logLogin(loginMethod: 'email');

  Future<void> logOnboardingStepViewed({
    required String step,
    required int stepIndex,
  }) => _analytics.logEvent(
    name: 'onboarding_step_viewed',
    parameters: {'step': step, 'step_index': stepIndex},
  );

  Future<void> logOnboardingCompleted({
    required String stage,
    String? primaryGoal,
  }) => _analytics.logEvent(
    name: 'onboarding_completed',
    parameters: {
      'stage': stage,
      if (primaryGoal != null) 'primary_goal': primaryGoal,
    },
  );

  Future<void> logSessionCreated({
    required String mode,
    required int questionCount,
  }) => _analytics.logEvent(
    name: 'session_created',
    parameters: {'mode': mode, 'question_count': questionCount},
  );

  Future<void> logQuestionAnswered({
    required bool isCorrect,
    required String mode,
    String? confidence,
  }) => _analytics.logEvent(
    name: 'question_answered',
    parameters: {
      'is_correct': isCorrect,
      'mode': mode,
      if (confidence != null) 'confidence': confidence,
    },
  );

  Future<void> logAskAceMessageSent() =>
      _analytics.logEvent(name: 'ask_ace_message_sent');

  Future<void> logSubscriptionPortalOpened() =>
      _analytics.logEvent(name: 'subscription_portal_opened');

  Future<void> logAccountDeleted() =>
      _analytics.logEvent(name: 'account_deleted');
}
