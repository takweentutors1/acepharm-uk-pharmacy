/// A `POST /api/v1/sessions/answer` submission that couldn't reach the
/// server because the device was offline — persisted so it can be replayed
/// once connectivity returns instead of being silently lost (Product
/// Invariant #6: no answer is ever lost on network drop).
class PendingAnswer {
  const PendingAnswer({
    required this.id,
    required this.sessionId,
    required this.questionId,
    required this.questionVersion,
    required this.selectedOptionId,
    required this.confidence,
    required this.timeTakenSeconds,
    required this.mode,
    required this.queuedAt,
  });

  /// Locally generated — unique per queue entry, not a server id.
  final String id;
  final String? sessionId;
  final String questionId;
  final int questionVersion;
  final String selectedOptionId;

  /// [Confidence.apiValue], stored as a raw string so this model has no
  /// dependency on the enum (kept a plain, Hive-serialisable value type).
  final String? confidence;
  final int timeTakenSeconds;

  /// [SessionMode.apiValue].
  final String mode;
  final DateTime queuedAt;

  Map<String, dynamic> toMap() => {
    'id': id,
    'sessionId': sessionId,
    'questionId': questionId,
    'questionVersion': questionVersion,
    'selectedOptionId': selectedOptionId,
    'confidence': confidence,
    'timeTakenSeconds': timeTakenSeconds,
    'mode': mode,
    'queuedAt': queuedAt.toIso8601String(),
  };

  factory PendingAnswer.fromMap(Map<dynamic, dynamic> map) => PendingAnswer(
    id: map['id'] as String,
    sessionId: map['sessionId'] as String?,
    questionId: map['questionId'] as String,
    questionVersion: map['questionVersion'] as int,
    selectedOptionId: map['selectedOptionId'] as String,
    confidence: map['confidence'] as String?,
    timeTakenSeconds: map['timeTakenSeconds'] as int,
    mode: map['mode'] as String,
    queuedAt: DateTime.parse(map['queuedAt'] as String),
  );
}
