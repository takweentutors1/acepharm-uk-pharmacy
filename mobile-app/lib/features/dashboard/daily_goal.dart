/// `GET /api/v1/analytics/daily-goal` — the real, timezone-aware daily
/// progress figures the dashboard's revision ring displays. Resets at
/// the learner's local midnight, not UTC.
class DailyGoal {
  const DailyGoal({
    required this.dailyTarget,
    required this.answeredToday,
    required this.isGoalCompleted,
  });

  final int dailyTarget;
  final int answeredToday;
  final bool isGoalCompleted;

  factory DailyGoal.fromJson(Map<String, dynamic> json) {
    return DailyGoal(
      dailyTarget: (json['dailyTarget'] as num).toInt(),
      answeredToday: (json['answeredToday'] as num).toInt(),
      isGoalCompleted: json['isGoalCompleted'] as bool? ?? false,
    );
  }
}
