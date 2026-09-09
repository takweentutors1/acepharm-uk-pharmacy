import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:mobile_app/core/offline/offline_answer_queue.dart';
import 'package:mobile_app/core/offline/pending_answer.dart';

PendingAnswer _answer({
  required String id,
  required DateTime queuedAt,
  String questionId = 'q-1',
}) => PendingAnswer(
  id: id,
  sessionId: 'session-1',
  questionId: questionId,
  questionVersion: 1,
  selectedOptionId: 'opt-a',
  confidence: 'medium',
  timeTakenSeconds: 12,
  mode: 'learn',
  queuedAt: queuedAt,
);

void main() {
  late Directory tempDir;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('offline_queue_test');
    Hive.init(tempDir.path);
  });

  tearDown(() async {
    await Hive.deleteFromDisk();
    if (tempDir.existsSync()) await tempDir.delete(recursive: true);
  });

  test('a freshly opened queue is empty', () async {
    final queue = OfflineAnswerQueue();
    expect(await queue.count(), 0);
    expect(await queue.all(), isEmpty);
  });

  test(
    'enqueue persists an answer that all() and count() then reflect',
    () async {
      final queue = OfflineAnswerQueue();
      await queue.enqueue(_answer(id: 'a', queuedAt: DateTime(2026, 1, 1)));

      expect(await queue.count(), 1);
      expect((await queue.all()).single.id, 'a');
    },
  );

  test(
    'all() returns queued answers oldest-first regardless of insertion order',
    () async {
      final queue = OfflineAnswerQueue();
      await queue.enqueue(_answer(id: 'newer', queuedAt: DateTime(2026, 1, 2)));
      await queue.enqueue(_answer(id: 'older', queuedAt: DateTime(2026, 1, 1)));

      final ids = (await queue.all()).map((a) => a.id).toList();
      expect(ids, ['older', 'newer']);
    },
  );

  test('remove deletes only the targeted entry', () async {
    final queue = OfflineAnswerQueue();
    await queue.enqueue(_answer(id: 'keep', queuedAt: DateTime(2026, 1, 1)));
    await queue.enqueue(_answer(id: 'drop', queuedAt: DateTime(2026, 1, 2)));

    await queue.remove('drop');

    final ids = (await queue.all()).map((a) => a.id).toList();
    expect(ids, ['keep']);
  });

  test(
    'watchCount emits the current count, then again after a mutation',
    () async {
      final queue = OfflineAnswerQueue();
      final counts = <int>[];
      final subscription = queue.watchCount().listen(counts.add);
      await Future<void>.delayed(const Duration(milliseconds: 50));

      await queue.enqueue(_answer(id: 'a', queuedAt: DateTime(2026, 1, 1)));
      await Future<void>.delayed(const Duration(milliseconds: 50));

      await subscription.cancel();
      expect(counts, [0, 1]);
    },
  );
}
