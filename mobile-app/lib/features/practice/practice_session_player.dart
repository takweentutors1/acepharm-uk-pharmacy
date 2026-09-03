import 'package:flutter/material.dart';

import 'ace_repository.dart';
import 'practice_session.dart';
import 'question_repository.dart';
import 'question_screen.dart';
import 'session_repository.dart';

/// Drives a created [PracticeSession] question-by-question through
/// [QuestionScreen]. Each question gets a fresh [QuestionScreen] element
/// (keyed by question ID) so per-question state — selection, confidence,
/// submission result — never leaks from one question into the next.
class PracticeSessionPlayer extends StatefulWidget {
  const PracticeSessionPlayer({
    super.key,
    required this.session,
    required this.sessionRepository,
    required this.questionRepository,
    required this.aceRepository,
    this.userId,
    this.onSessionComplete,
  });

  final PracticeSession session;
  final SessionRepository sessionRepository;
  final QuestionRepository questionRepository;
  final AceRepository aceRepository;
  final String? userId;
  final VoidCallback? onSessionComplete;

  @override
  State<PracticeSessionPlayer> createState() => _PracticeSessionPlayerState();
}

class _PracticeSessionPlayerState extends State<PracticeSessionPlayer> {
  int _index = 0;

  void _next() {
    if (_index >= widget.session.questions.length - 1) {
      Navigator.of(context).pop();
      widget.onSessionComplete?.call();
      return;
    }
    setState(() => _index++);
  }

  @override
  Widget build(BuildContext context) {
    final questions = widget.session.questions;
    if (questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text('No questions were returned for this session.'),
          ),
        ),
      );
    }

    final question = questions[_index];
    return QuestionScreen(
      key: ValueKey(question.id),
      question: question,
      mode: widget.session.mode,
      sessionRepository: widget.sessionRepository,
      questionRepository: widget.questionRepository,
      aceRepository: widget.aceRepository,
      sessionId: widget.session.sessionId,
      userId: widget.userId,
      onNext: _next,
    );
  }
}
