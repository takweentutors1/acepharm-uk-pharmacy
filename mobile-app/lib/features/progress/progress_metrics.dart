import 'mastery_status.dart';

/// One accuracy figure — always kept isolated from the others (product
/// invariant #5: first-attempt, practice, and repeat accuracy are never
/// merged into a single score).
class AccuracyBucket {
  const AccuracyBucket({
    required this.total,
    required this.correct,
    required this.percentage,
  });

  final int total;
  final int correct;
  final int percentage;

  factory AccuracyBucket.fromJson(Map<String, dynamic> json) {
    return AccuracyBucket(
      total: (json['total'] as num).toInt(),
      correct: (json['correct'] as num).toInt(),
      percentage: (json['percentage'] as num).toInt(),
    );
  }
}

class ConfidenceBucket {
  const ConfidenceBucket({
    required this.total,
    required this.correct,
    required this.accuracy,
  });

  final int total;
  final int correct;
  final int accuracy;

  factory ConfidenceBucket.fromJson(Map<String, dynamic> json) {
    return ConfidenceBucket(
      total: (json['total'] as num).toInt(),
      correct: (json['correct'] as num).toInt(),
      accuracy: (json['accuracy'] as num).toInt(),
    );
  }
}

enum CalibrationSummary { underconfident, calibrated, overconfident }

/// One row of the 19-topic mastery grid.
class SubtopicMastery {
  const SubtopicMastery({
    required this.id,
    required this.name,
    required this.total,
    required this.attempted,
    required this.coveragePercentage,
    required this.firstPassAccuracy,
    required this.status,
  });

  final String id;
  final String name;
  final int total;
  final int attempted;
  final int coveragePercentage;
  final int firstPassAccuracy;
  final MasteryStatus status;

  factory SubtopicMastery.fromJson(Map<String, dynamic> json) {
    return SubtopicMastery(
      id: json['id'] as String,
      name: json['name'] as String,
      total: (json['total'] as num).toInt(),
      attempted: (json['attempted'] as num).toInt(),
      coveragePercentage: (json['coveragePercentage'] as num).toInt(),
      firstPassAccuracy: (json['firstPassAccuracy'] as num).toInt(),
      status: MasteryStatus.fromLabel(json['statusLabel'] as String?),
    );
  }
}

/// Per-category coverage row from the server's `coverageMap`, including
/// its 19-topic mastery grid subtopics.
class CategoryCoverage {
  const CategoryCoverage({
    required this.categoryId,
    required this.categoryName,
    required this.totalQuestions,
    required this.attemptedQuestions,
    this.subtopics = const [],
  });

  final String categoryId;
  final String categoryName;
  final int totalQuestions;
  final int attemptedQuestions;
  final List<SubtopicMastery> subtopics;

  factory CategoryCoverage.fromJson(Map<String, dynamic> json) {
    final subtopicsJson = json['subtopics'] as List<dynamic>? ?? const [];
    return CategoryCoverage(
      categoryId: json['categoryId'] as String,
      categoryName: json['categoryName'] as String,
      totalQuestions: (json['totalQuestions'] as num).toInt(),
      attemptedQuestions: (json['attemptedQuestions'] as num).toInt(),
      subtopics: subtopicsJson
          .map((e) => SubtopicMastery.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Mirrors `ProgressAnalyticsResult` from
/// `web-app/apps/api/src/lib/progress-calculator.ts` — the five separate
/// analytics pillars, kept as five distinct values throughout, never
/// collapsed into one composite score.
class ProgressMetrics {
  const ProgressMetrics({
    required this.firstAttempt,
    required this.practice,
    required this.repeat,
    required this.lowConfidence,
    required this.mediumConfidence,
    required this.highConfidence,
    required this.calibrationSummary,
    required this.categoryCoverage,
  });

  final AccuracyBucket firstAttempt;
  final AccuracyBucket practice;
  final AccuracyBucket repeat;
  final ConfidenceBucket lowConfidence;
  final ConfidenceBucket mediumConfidence;
  final ConfidenceBucket highConfidence;
  final CalibrationSummary calibrationSummary;
  final List<CategoryCoverage> categoryCoverage;

  /// Pillar 5: aggregate curriculum coverage across every category,
  /// shaped like [AccuracyBucket] so it can share the same pillar card
  /// widget ("correct" reads as "attempted" for this one).
  AccuracyBucket get coverageBucket {
    final totalQuestions = categoryCoverage.fold<int>(
      0,
      (sum, c) => sum + c.totalQuestions,
    );
    final attempted = categoryCoverage.fold<int>(
      0,
      (sum, c) => sum + c.attemptedQuestions,
    );
    final percentage = totalQuestions == 0
        ? 0
        : ((attempted / totalQuestions) * 100).round();
    return AccuracyBucket(
      total: totalQuestions,
      correct: attempted,
      percentage: percentage,
    );
  }

  factory ProgressMetrics.fromJson(Map<String, dynamic> json) {
    final accuracySplit = json['accuracySplit'] as Map<String, dynamic>;
    final calibrationMatrix = json['calibrationMatrix'] as Map<String, dynamic>;
    final coverageMap = json['coverageMap'] as List<dynamic>;

    return ProgressMetrics(
      firstAttempt: AccuracyBucket.fromJson(
        accuracySplit['firstAttempt'] as Map<String, dynamic>,
      ),
      practice: AccuracyBucket.fromJson(
        accuracySplit['practice'] as Map<String, dynamic>,
      ),
      repeat: AccuracyBucket.fromJson(
        accuracySplit['repeat'] as Map<String, dynamic>,
      ),
      lowConfidence: ConfidenceBucket.fromJson(
        calibrationMatrix['lowConfidence'] as Map<String, dynamic>,
      ),
      mediumConfidence: ConfidenceBucket.fromJson(
        calibrationMatrix['mediumConfidence'] as Map<String, dynamic>,
      ),
      highConfidence: ConfidenceBucket.fromJson(
        calibrationMatrix['highConfidence'] as Map<String, dynamic>,
      ),
      calibrationSummary: switch (calibrationMatrix['calibrationSummary']
          as String?) {
        'overconfident' => CalibrationSummary.overconfident,
        'underconfident' => CalibrationSummary.underconfident,
        _ => CalibrationSummary.calibrated,
      },
      categoryCoverage: coverageMap
          .map((e) => CategoryCoverage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
