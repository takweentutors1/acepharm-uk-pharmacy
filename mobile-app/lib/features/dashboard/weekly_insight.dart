/// Mirrors `WeeklyInsightSummary` from
/// `web-app/apps/api/src/lib/weekly-insight-generator.ts`. The paragraph is
/// always server-generated (via the weekly cron, Section 5.2 & 5.3) and
/// cached in KV/D1 — the client only ever reads it, never computes it.
class WeeklyInsight {
  const WeeklyInsight({
    required this.insightParagraph,
    required this.confidentlyIncorrectCount,
    required this.source,
    this.totalAttemptsThisWeek,
    this.accuracyThisWeek,
    this.weakestCategoryName,
    this.strongestCategoryName,
    this.generatedAt,
  });

  final String insightParagraph;
  final int confidentlyIncorrectCount;

  /// `'kv_cache'` once the weekly cron has generated a real, personalised
  /// insight; `'default_empty'` before the learner's first cron cycle.
  final String source;

  final int? totalAttemptsThisWeek;
  final int? accuracyThisWeek;
  final String? weakestCategoryName;
  final String? strongestCategoryName;
  final DateTime? generatedAt;

  bool get isPersonalized => source == 'kv_cache';

  factory WeeklyInsight.fromJson(Map<String, dynamic> json) {
    return WeeklyInsight(
      insightParagraph:
          json['insightParagraph'] as String? ??
          'Complete your first practice sessions this week to receive your '
              'scheduled weekly clinical coaching insight from Ace.',
      confidentlyIncorrectCount:
          (json['confidentlyIncorrectCount'] as num?)?.toInt() ?? 0,
      source: json['source'] as String? ?? 'default_empty',
      totalAttemptsThisWeek: (json['totalAttemptsThisWeek'] as num?)?.toInt(),
      accuracyThisWeek: (json['accuracyThisWeek'] as num?)?.toInt(),
      weakestCategoryName: json['weakestCategoryName'] as String?,
      strongestCategoryName: json['strongestCategoryName'] as String?,
      generatedAt: switch (json['generatedAt']) {
        String value => DateTime.tryParse(value),
        _ => null,
      },
    );
  }
}
