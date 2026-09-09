import 'package:hive_flutter/hive_flutter.dart';

import 'pending_answer.dart';

/// Local, durable store for answers that failed to submit because the
/// device was offline. Backed by a Hive box — survives app restarts, so a
/// user who closes the app before reconnecting doesn't lose the answer.
///
/// Every method is overridable (not `final`) so tests can substitute an
/// in-memory fake instead of exercising real Hive I/O — see
/// `test/core/offline/`.
class OfflineAnswerQueue {
  static const boxName = 'pending_answers';

  Box<Map>? _box;

  Future<Box<Map>> _openBox() async {
    return _box ??= await Hive.openBox<Map>(boxName);
  }

  Future<void> enqueue(PendingAnswer answer) async {
    final box = await _openBox();
    await box.put(answer.id, answer.toMap());
  }

  /// All queued answers, oldest first — replay order matters so
  /// `attemptNumber` bookkeeping on the server stays correct.
  Future<List<PendingAnswer>> all() async {
    final box = await _openBox();
    final answers = box.values
        .map((map) => PendingAnswer.fromMap(map))
        .toList();
    answers.sort((a, b) => a.queuedAt.compareTo(b.queuedAt));
    return answers;
  }

  Future<void> remove(String id) async {
    final box = await _openBox();
    await box.delete(id);
  }

  Future<int> count() async {
    final box = await _openBox();
    return box.length;
  }

  /// Emits the current count immediately, then again on every change —
  /// what the dashboard's "N pending" indicator listens to.
  Stream<int> watchCount() async* {
    final box = await _openBox();
    yield box.length;
    yield* box.watch().map((_) => box.length);
  }
}
