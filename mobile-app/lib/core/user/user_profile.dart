/// The signed-in learner's D1 profile from `GET /api/v1/auth/me`.
///
/// [id] is the D1 `users.id` — distinct from the Firebase UID
/// (`FirebaseAuth.currentUser.uid`). Several endpoints that aren't wired
/// with `requireAuth` (weekly insight, Ask Ace) accept an explicit
/// `user_id`/`userId` override and key their personalisation off *this*
/// ID, not the Firebase one — passing the Firebase UID there silently
/// fails to personalise anything.
class UserProfile {
  const UserProfile({
    required this.id,
    required this.email,
    this.firstName,
    this.hasCompletedOnboarding = false,
    this.assessmentDate,
  });

  final String id;
  final String email;
  final String? firstName;

  /// True once the learner has been through the 5-step onboarding flow
  /// (`PUT /api/v1/user/onboarding`) at least once. The server derives
  /// this from whether a `user_profiles` row exists at all, not from any
  /// single field on it.
  final bool hasCompletedOnboarding;

  /// Set in onboarding step 3 — powers the dashboard's persistent exam
  /// countdown. Null if the learner skipped that step.
  final DateTime? assessmentDate;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>;
    final onboarding = json['onboarding'] as Map<String, dynamic>?;
    final assessmentDateStr = onboarding?['assessmentDate'] as String?;
    return UserProfile(
      id: user['id'] as String,
      email: user['email'] as String,
      firstName: user['first_name'] as String?,
      hasCompletedOnboarding: onboarding?['completed'] as bool? ?? false,
      assessmentDate: assessmentDateStr == null
          ? null
          : DateTime.tryParse(assessmentDateStr),
    );
  }
}
