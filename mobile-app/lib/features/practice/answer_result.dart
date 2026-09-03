import 'question.dart';

/// The response body of `POST /api/v1/sessions/answer`.
/// [isFirstEverAttempt] is the server's own determination of whether this
/// answer was written to the isolated `question_first_attempts` store —
/// the client never computes this itself, only displays it.
class AnswerResult {
  const AnswerResult({
    required this.isCorrect,
    required this.isFirstEverAttempt,
    required this.correctOptionId,
    required this.options,
    this.explanation,
  });

  final bool isCorrect;
  final bool isFirstEverAttempt;
  final String correctOptionId;
  final List<QuestionOption> options;
  final QuestionExplanation? explanation;

  factory AnswerResult.fromJson(Map<String, dynamic> json) {
    return AnswerResult(
      isCorrect: json['isCorrect'] as bool,
      isFirstEverAttempt: json['isFirstEverAttempt'] as bool,
      correctOptionId: json['correctOptionId'] as String,
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

  String? rationaleFor(String optionId) {
    for (final option in options) {
      if (option.id == optionId) return option.rationale;
    }
    return null;
  }
}
