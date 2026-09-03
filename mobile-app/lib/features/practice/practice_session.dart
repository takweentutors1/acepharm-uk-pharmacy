import 'question.dart';
import 'session_mode.dart';

/// The result of `POST /api/v1/sessions/create`, including the full
/// hydrated question list the endpoint returns for immediate
/// client-side rendering — this is what the question player iterates.
class PracticeSession {
  const PracticeSession({
    required this.sessionId,
    required this.mode,
    required this.totalQuestions,
    required this.questions,
    this.timeLimitSeconds,
  });

  final String sessionId;
  final SessionMode mode;
  final int totalQuestions;
  final List<PracticeQuestion> questions;
  final int? timeLimitSeconds;

  factory PracticeSession.fromJson(Map<String, dynamic> json) {
    final questionsJson = json['questions'] as List<dynamic>? ?? const [];
    return PracticeSession(
      sessionId: json['sessionId'] as String,
      mode: SessionMode.fromApiValue(json['mode'] as String?),
      totalQuestions: (json['totalQuestions'] as num).toInt(),
      questions: questionsJson
          .map((e) => PracticeQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
      timeLimitSeconds: (json['timeLimitSeconds'] as num?)?.toInt(),
    );
  }
}
