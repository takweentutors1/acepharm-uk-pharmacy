import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/practice/ace_repository.dart';
import 'package:mobile_app/features/practice/answer_result.dart';
import 'package:mobile_app/features/practice/confidence.dart';
import 'package:mobile_app/features/practice/practice_session.dart';
import 'package:mobile_app/features/practice/practice_session_player.dart';
import 'package:mobile_app/features/practice/question.dart';
import 'package:mobile_app/features/practice/question_repository.dart';
import 'package:mobile_app/features/practice/session_mode.dart';
import 'package:mobile_app/features/practice/session_repository.dart';

PracticeQuestion _question(String id, String stem) {
  return PracticeQuestion(
    id: id,
    publicId: 'ACP-$id',
    version: 1,
    content: QuestionContent(stem: stem, leadIn: 'Lead-in for $id'),
    options: [
      QuestionOption(
        id: '$id-a',
        label: 'A',
        content: 'Option A',
        isCorrect: true,
        rationale: 'Because A.',
        sortOrder: 0,
      ),
      QuestionOption(
        id: '$id-b',
        label: 'B',
        content: 'Option B',
        isCorrect: false,
        rationale: 'Because not B.',
        sortOrder: 1,
      ),
    ],
  );
}

class _FakeSessionRepository extends SessionRepository {
  _FakeSessionRepository() : super(Dio());

  final List<String> submittedQuestionIds = [];

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
    submittedQuestionIds.add(questionId);
    return AnswerResult(
      isCorrect: true,
      isFirstEverAttempt: true,
      correctOptionId: '$questionId-a',
      options: const [],
    );
  }
}

class _FakeQuestionRepository extends QuestionRepository {
  _FakeQuestionRepository() : super(Dio());

  @override
  Future<bool> toggleBookmark(String questionId) async => false;
}

Future<void> _answerAndSubmit(WidgetTester tester) async {
  await tester.tap(find.text('A. Option A'));
  await tester.pump();
  await tester.tap(find.text('High'));
  await tester.pump();
  await tester.tap(find.text('Submit answer'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('advances to the next question and resets per-question state', (
    tester,
  ) async {
    final session = PracticeSession(
      sessionId: 'session-1',
      mode: SessionMode.learn,
      totalQuestions: 2,
      questions: [
        _question('q1', 'Stem for question one.'),
        _question('q2', 'Stem for question two.'),
      ],
    );
    final sessions = _FakeSessionRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: PracticeSessionPlayer(
          session: session,
          sessionRepository: sessions,
          questionRepository: _FakeQuestionRepository(),
          aceRepository: AceRepository(Dio()),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Stem for question one.'), findsOneWidget);

    await _answerAndSubmit(tester);
    expect(sessions.submittedQuestionIds, ['q1']);
    expect(find.text('Next question'), findsOneWidget);

    await tester.tap(find.text('Next question'));
    await tester.pump();

    // New question: stem changed, and pre-submission state is reset —
    // no stale "Next question"/result carried over from q1.
    expect(find.text('Stem for question two.'), findsOneWidget);
    expect(find.text('Submit answer'), findsOneWidget);
    expect(find.text('Next question'), findsNothing);

    await _answerAndSubmit(tester);
    expect(sessions.submittedQuestionIds, ['q1', 'q2']);
  });

  testWidgets('finishing the last question pops and signals completion', (
    tester,
  ) async {
    final session = PracticeSession(
      sessionId: 'session-1',
      mode: SessionMode.learn,
      totalQuestions: 1,
      questions: [_question('q1', 'Only question.')],
    );
    var completed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PracticeSessionPlayer(
                      session: session,
                      sessionRepository: _FakeSessionRepository(),
                      questionRepository: _FakeQuestionRepository(),
                      aceRepository: AceRepository(Dio()),
                      onSessionComplete: () => completed = true,
                    ),
                  ),
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.text('Only question.'), findsOneWidget);

    await _answerAndSubmit(tester);
    await tester.tap(find.text('Next question'));
    await tester.pumpAndSettle();

    expect(completed, isTrue);
    expect(find.text('Only question.'), findsNothing);
  });

  testWidgets('shows a message instead of crashing on an empty session', (
    tester,
  ) async {
    const session = PracticeSession(
      sessionId: 'session-1',
      mode: SessionMode.learn,
      totalQuestions: 0,
      questions: [],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: PracticeSessionPlayer(
          session: session,
          sessionRepository: _FakeSessionRepository(),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: AceRepository(Dio()),
        ),
      ),
    );
    await tester.pump();

    expect(
      find.text('No questions were returned for this session.'),
      findsOneWidget,
    );
  });
}
