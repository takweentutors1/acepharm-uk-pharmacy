import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/offline/offline_answer_queue.dart';
import 'package:mobile_app/core/offline/offline_answer_sync_service.dart';
import 'package:mobile_app/core/offline/pending_answer.dart';
import 'package:mobile_app/features/practice/answer_result.dart';
import 'package:mobile_app/features/practice/confidence.dart';
import 'package:mobile_app/features/practice/session_mode.dart';
import 'package:mobile_app/features/practice/session_repository.dart';

PendingAnswer _answer(String id, DateTime queuedAt) => PendingAnswer(
  id: id,
  sessionId: 'session-1',
  questionId: 'q-$id',
  questionVersion: 1,
  selectedOptionId: 'opt-a',
  confidence: 'high',
  timeTakenSeconds: 10,
  mode: 'learn',
  queuedAt: queuedAt,
);

class _InMemoryQueue extends OfflineAnswerQueue {
  final List<PendingAnswer> _items = [];

  @override
  Future<void> enqueue(PendingAnswer answer) async => _items.add(answer);

  @override
  Future<List<PendingAnswer>> all() async {
    final sorted = List.of(_items);
    sorted.sort((a, b) => a.queuedAt.compareTo(b.queuedAt));
    return sorted;
  }

  @override
  Future<void> remove(String id) async => _items.removeWhere((a) => a.id == id);

  @override
  Future<int> count() async => _items.length;
}

class _FakeSessionRepository extends SessionRepository {
  _FakeSessionRepository({this.failOnQuestionId}) : super(Dio());

  final String? failOnQuestionId;
  final List<String> submittedQuestionIds = [];
  final List<Confidence?> submittedConfidences = [];
  final List<SessionMode> submittedModes = [];

  @override
  Future<AnswerResult> submitAnswer({
    String? sessionId,
    required String questionId,
    required int questionVersion,
    required String selectedOptionId,
    Confidence? confidence,
    required int timeTakenSeconds,
    required SessionMode mode,
  }) async {
    if (questionId == failOnQuestionId) {
      throw DioException(requestOptions: RequestOptions());
    }
    submittedQuestionIds.add(questionId);
    submittedConfidences.add(confidence);
    submittedModes.add(mode);
    return const AnswerResult(
      isCorrect: true,
      isFirstEverAttempt: false,
      correctOptionId: 'opt-a',
      options: [],
    );
  }
}

void main() {
  test(
    'flush replays every queued answer, oldest first, then empties the queue',
    () async {
      final queue = _InMemoryQueue();
      final sessions = _FakeSessionRepository();
      await queue.enqueue(_answer('b', DateTime(2026, 1, 2)));
      await queue.enqueue(_answer('a', DateTime(2026, 1, 1)));

      final service = OfflineAnswerSyncService(
        queue: queue,
        sessionRepository: sessions,
      );
      await service.flush();

      expect(sessions.submittedQuestionIds, ['q-a', 'q-b']);
      expect(await queue.count(), 0);
    },
  );

  test(
    'converts the stored apiValue strings back to the right enums',
    () async {
      final queue = _InMemoryQueue();
      final sessions = _FakeSessionRepository();
      await queue.enqueue(_answer('a', DateTime(2026, 1, 1)));

      final service = OfflineAnswerSyncService(
        queue: queue,
        sessionRepository: sessions,
      );
      await service.flush();

      expect(sessions.submittedConfidences.single, Confidence.high);
      expect(sessions.submittedModes.single, SessionMode.learn);
    },
  );

  test(
    'stops at the first failure, preserving order for the next attempt',
    () async {
      final queue = _InMemoryQueue();
      final sessions = _FakeSessionRepository(failOnQuestionId: 'q-b');
      await queue.enqueue(_answer('a', DateTime(2026, 1, 1)));
      await queue.enqueue(_answer('b', DateTime(2026, 1, 2)));
      await queue.enqueue(_answer('c', DateTime(2026, 1, 3)));

      final service = OfflineAnswerSyncService(
        queue: queue,
        sessionRepository: sessions,
      );
      await service.flush();

      // 'a' synced and was removed; 'b' failed so the pass stopped there,
      // leaving 'b' and 'c' both still queued for the next attempt.
      expect(sessions.submittedQuestionIds, ['q-a']);
      final remaining = (await queue.all()).map((a) => a.id).toList();
      expect(remaining, ['b', 'c']);
    },
  );

  test('a second flush is a no-op while one is already running', () async {
    final queue = _InMemoryQueue();
    final sessions = _FakeSessionRepository();
    await queue.enqueue(_answer('a', DateTime(2026, 1, 1)));

    final service = OfflineAnswerSyncService(
      queue: queue,
      sessionRepository: sessions,
    );

    final first = service.flush();
    final second = service.flush();
    await Future.wait([first, second]);

    // Only the first pass should have submitted anything.
    expect(sessions.submittedQuestionIds, ['q-a']);
  });
}
