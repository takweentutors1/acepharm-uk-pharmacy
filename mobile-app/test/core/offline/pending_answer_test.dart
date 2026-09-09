import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/offline/pending_answer.dart';

void main() {
  test('round-trips through toMap/fromMap', () {
    final answer = PendingAnswer(
      id: 'q-1-12345',
      sessionId: 'session-1',
      questionId: 'q-1',
      questionVersion: 2,
      selectedOptionId: 'opt-b',
      confidence: 'high',
      timeTakenSeconds: 42,
      mode: 'learn',
      queuedAt: DateTime.utc(2026, 3, 5, 10, 30),
    );

    final restored = PendingAnswer.fromMap(answer.toMap());

    expect(restored.id, answer.id);
    expect(restored.sessionId, answer.sessionId);
    expect(restored.questionId, answer.questionId);
    expect(restored.questionVersion, answer.questionVersion);
    expect(restored.selectedOptionId, answer.selectedOptionId);
    expect(restored.confidence, answer.confidence);
    expect(restored.timeTakenSeconds, answer.timeTakenSeconds);
    expect(restored.mode, answer.mode);
    expect(restored.queuedAt, answer.queuedAt);
  });

  test('round-trips a null sessionId and confidence', () {
    final answer = PendingAnswer(
      id: 'q-2-999',
      sessionId: null,
      questionId: 'q-2',
      questionVersion: 1,
      selectedOptionId: 'opt-a',
      confidence: null,
      timeTakenSeconds: 5,
      mode: 'timed',
      queuedAt: DateTime.utc(2026, 1, 1),
    );

    final restored = PendingAnswer.fromMap(answer.toMap());

    expect(restored.sessionId, isNull);
    expect(restored.confidence, isNull);
  });
}
