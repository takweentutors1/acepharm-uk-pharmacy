import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../../features/practice/confidence.dart';
import '../../features/practice/session_mode.dart';
import '../../features/practice/session_repository.dart';
import 'offline_answer_queue.dart';

/// Flushes [OfflineAnswerQueue] whenever connectivity returns, replaying
/// each queued `submitAnswer` call in the order it was queued. Call
/// [start] once (e.g. from the dashboard's `initState`) and [dispose] when
/// that host is torn down.
class OfflineAnswerSyncService {
  OfflineAnswerSyncService({
    required this.queue,
    required this.sessionRepository,
    Connectivity? connectivity,
  }) : _connectivity = connectivity ?? Connectivity();

  final OfflineAnswerQueue queue;
  final SessionRepository sessionRepository;
  final Connectivity _connectivity;

  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _isFlushing = false;

  void start() {
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      if (results.any((result) => result != ConnectivityResult.none)) {
        unawaited(flush());
      }
    });
    unawaited(flush());
  }

  void dispose() {
    _subscription?.cancel();
  }

  /// Replays queued answers oldest-first, stopping at the first failure —
  /// still offline, or the server rejected it — rather than skipping
  /// ahead and losing ordering. The next connectivity event or app launch
  /// picks up where this left off.
  Future<void> flush() async {
    if (_isFlushing) return;
    _isFlushing = true;
    try {
      final pending = await queue.all();
      for (final answer in pending) {
        try {
          await sessionRepository.submitAnswer(
            sessionId: answer.sessionId,
            questionId: answer.questionId,
            questionVersion: answer.questionVersion,
            selectedOptionId: answer.selectedOptionId,
            confidence: Confidence.fromApiValue(answer.confidence),
            timeTakenSeconds: answer.timeTakenSeconds,
            mode: SessionMode.fromApiValue(answer.mode),
          );
          await queue.remove(answer.id);
        } catch (_) {
          break;
        }
      }
    } finally {
      _isFlushing = false;
    }
  }
}
