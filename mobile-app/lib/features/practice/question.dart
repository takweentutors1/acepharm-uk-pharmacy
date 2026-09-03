/// Mirrors the hydrated question shape returned by
/// `fetchHydratedQuestions` in `web-app/apps/api/src/routes/sessions.ts`.
class QuestionOption {
  const QuestionOption({
    required this.id,
    required this.label,
    required this.content,
    required this.isCorrect,
    required this.rationale,
    required this.sortOrder,
  });

  final String id;
  final String label;
  final String content;

  /// Present in the raw API payload even before submission — the UI must
  /// never read these two fields until [AnswerResult] exists (product
  /// invariant: zero pre-submission colour/correctness cues).
  final bool isCorrect;
  final String rationale;

  final int sortOrder;

  factory QuestionOption.fromJson(Map<String, dynamic> json) {
    return QuestionOption(
      id: json['id'] as String,
      label: json['label'] as String,
      content: json['content'] as String,
      isCorrect: json['isCorrect'] as bool? ?? false,
      rationale: json['rationale'] as String? ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class QuestionContent {
  const QuestionContent({required this.stem, required this.leadIn});

  final String stem;
  final String leadIn;

  factory QuestionContent.fromJson(Map<String, dynamic> json) {
    return QuestionContent(
      stem: json['stem'] as String,
      leadIn: json['leadIn'] as String,
    );
  }
}

class QuestionExplanation {
  const QuestionExplanation({
    required this.summaryTakeaway,
    required this.detailedExplanation,
    this.clinicalGuidanceReference,
  });

  final String summaryTakeaway;
  final String detailedExplanation;
  final String? clinicalGuidanceReference;

  factory QuestionExplanation.fromJson(Map<String, dynamic> json) {
    return QuestionExplanation(
      summaryTakeaway: json['summaryTakeaway'] as String,
      detailedExplanation: json['detailedExplanation'] as String,
      clinicalGuidanceReference: json['clinicalGuidanceReference'] as String?,
    );
  }
}

class PracticeQuestion {
  const PracticeQuestion({
    required this.id,
    required this.publicId,
    required this.version,
    required this.content,
    required this.options,
    this.explanation,
  });

  final String id;
  final String publicId;
  final int version;
  final QuestionContent content;
  final List<QuestionOption> options;
  final QuestionExplanation? explanation;

  factory PracticeQuestion.fromJson(Map<String, dynamic> json) {
    return PracticeQuestion(
      id: json['id'] as String,
      publicId: json['publicId'] as String,
      version: (json['version'] as num?)?.toInt() ?? 1,
      content: QuestionContent.fromJson(
        json['content'] as Map<String, dynamic>,
      ),
      options: (json['options'] as List<dynamic>)
          .map((e) => QuestionOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      explanation: json['explanation'] == null
          ? null
          : QuestionExplanation.fromJson(
              json['explanation'] as Map<String, dynamic>,
            ),
    );
  }
}
