enum RecommendationReason {
  weakAccuracy,
  lowCoverage,
  mostUnseen,
  dueForReview,
}

/// Mirrors `RecommendationResult` from
/// `web-app/apps/api/src/lib/recommendation-engine.ts`. [reasonText] is
/// always populated server-side — the UI must never render a recommended
/// session without it (product invariant: no unexplained recommendations).
class Recommendation {
  const Recommendation({
    required this.reason,
    required this.reasonText,
    required this.subtopicId,
    required this.subtopicName,
    required this.categoryName,
    required this.availableUnseenCount,
    required this.totalQuestionsInSubtopic,
    required this.attemptsCount,
    required this.recommendedQuestionCount,
    this.accuracyPercentage,
  });

  final RecommendationReason reason;
  final String reasonText;
  final String subtopicId;
  final String subtopicName;
  final String categoryName;
  final int availableUnseenCount;
  final int totalQuestionsInSubtopic;
  final int attemptsCount;
  final int recommendedQuestionCount;
  final int? accuracyPercentage;

  factory Recommendation.fromJson(Map<String, dynamic> json) {
    return Recommendation(
      reason: switch (json['reason'] as String?) {
        'weak_accuracy' => RecommendationReason.weakAccuracy,
        'low_coverage' => RecommendationReason.lowCoverage,
        'due_for_review' => RecommendationReason.dueForReview,
        _ => RecommendationReason.mostUnseen,
      },
      reasonText: json['reasonText'] as String,
      subtopicId: json['subtopicId'] as String,
      subtopicName: json['subtopicName'] as String,
      categoryName: json['categoryName'] as String,
      availableUnseenCount: (json['availableUnseenCount'] as num).toInt(),
      totalQuestionsInSubtopic: (json['totalQuestionsInSubtopic'] as num)
          .toInt(),
      attemptsCount: (json['attemptsCount'] as num).toInt(),
      recommendedQuestionCount: (json['recommendedQuestionCount'] as num)
          .toInt(),
      accuracyPercentage: (json['accuracyPercentage'] as num?)?.toInt(),
    );
  }
}
