import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/theme/ace_colors.dart';
import 'package:mobile_app/core/widgets/widgets.dart';
import 'package:mobile_app/features/practice/ace_citation.dart';
import 'package:mobile_app/features/practice/ace_repository.dart';
import 'package:mobile_app/features/practice/answer_result.dart';
import 'package:mobile_app/features/practice/confidence.dart';
import 'package:mobile_app/features/practice/question.dart';
import 'package:mobile_app/features/practice/question_note.dart';
import 'package:mobile_app/features/practice/question_repository.dart';
import 'package:mobile_app/features/practice/question_screen.dart';
import 'package:mobile_app/features/practice/session_mode.dart';
import 'package:mobile_app/features/practice/session_repository.dart';

final _question = const PracticeQuestion(
  id: 'q-1',
  publicId: 'ACP-CV-0012',
  version: 1,
  content: QuestionContent(
    stem: 'A 68-year-old patient presents with hypertension.',
    leadIn: 'Which is the most appropriate first-line treatment?',
  ),
  options: [
    QuestionOption(
      id: 'opt-a',
      label: 'A',
      content: 'Option A',
      isCorrect: false,
      rationale: 'Rationale A',
      sortOrder: 0,
    ),
    QuestionOption(
      id: 'opt-b',
      label: 'B',
      content: 'Option B',
      isCorrect: true,
      rationale: 'Rationale B',
      sortOrder: 1,
    ),
  ],
);

class _FakeSessionRepository extends SessionRepository {
  _FakeSessionRepository({
    this.isFirstEverAttempt = true,
    this.fail = false,
    this.explanation,
  }) : super(Dio());

  final bool isFirstEverAttempt;
  final bool fail;
  final QuestionExplanation? explanation;
  final List<String> selectedOptionIds = [];
  final List<Confidence?> confidences = [];

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
    selectedOptionIds.add(selectedOptionId);
    confidences.add(confidence);
    if (fail) throw DioException(requestOptions: RequestOptions());
    return AnswerResult(
      isCorrect: selectedOptionId == 'opt-b',
      isFirstEverAttempt: isFirstEverAttempt,
      correctOptionId: 'opt-b',
      options: _question.options,
      explanation: explanation,
    );
  }
}

class _FakeAceRepository extends AceRepository {
  _FakeAceRepository({this.refuse = false}) : super(Dio());

  final bool refuse;
  final List<String> prompts = [];

  @override
  Future<AceReplyResult> sendMessage({
    required String contextId,
    required String prompt,
    String? threadId,
    String? userId,
  }) async {
    prompts.add(prompt);
    if (refuse) {
      return AceReplyResult(
        content:
            "I can't find this specific clinical guidance in our reviewed "
            "question bank or subtopic notes, so I won't guess. Please "
            'refer directly to the current BNF or NICE guidance for this '
            'query.',
        threadId: threadId ?? 'thread-1',
        citations: const [],
        refused: true,
      );
    }
    return AceReplyResult(
      content: 'Ace reply to: $prompt',
      threadId: threadId ?? 'thread-1',
      citations: const [
        AceCitation(
          id: 'chunk-1',
          sourceType: 'subtopic_note',
          sourceId: 'sub-1',
          label: 'Cardiovascular Therapeutics — subtopic notes',
        ),
      ],
    );
  }
}

AceRepository _noopAceRepository() => AceRepository(Dio());

class _FakeQuestionRepository extends QuestionRepository {
  _FakeQuestionRepository() : super(Dio());

  bool bookmarked = false;
  int toggleCount = 0;

  @override
  Future<bool> toggleBookmark(String questionId) async {
    toggleCount++;
    bookmarked = !bookmarked;
    return bookmarked;
  }

  @override
  Future<List<QuestionNote>> fetchNotes(String questionId) async => const [];

  @override
  Future<void> saveNote(
    String questionId, {
    String? title,
    required String content,
  }) async {}
}

Widget _wrap(Widget child) => MaterialApp(home: child);

AceButton _findButton(WidgetTester tester, String label) =>
    tester.widget<AceButton>(find.widgetWithText(AceButton, label));

void main() {
  testWidgets(
    'submit stays disabled until both an option and confidence are chosen',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          QuestionScreen(
            question: _question,
            mode: SessionMode.learn,
            sessionRepository: _FakeSessionRepository(),
            questionRepository: _FakeQuestionRepository(),
            aceRepository: _noopAceRepository(),
          ),
        ),
      );
      await tester.pump();

      expect(_findButton(tester, 'Submit answer').onPressed, isNull);

      await tester.tap(find.text('A. Option A'));
      await tester.pump();
      expect(_findButton(tester, 'Submit answer').onPressed, isNull);

      await tester.tap(find.text('High'));
      await tester.pump();
      expect(_findButton(tester, 'Submit answer').onPressed, isNotNull);
    },
  );

  testWidgets('shows no correctness colour or icon before submission', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('A. Option A'));
    await tester.pump();

    expect(find.byIcon(Icons.check_circle), findsNothing);
    expect(find.byIcon(Icons.cancel), findsNothing);
    expect(find.textContaining('Rationale'), findsNothing);
  });

  testWidgets('Cover Options hides then reveals the option list', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('A. Option A'), findsOneWidget);

    await tester.tap(find.byType(Switch));
    await tester.pump();

    expect(find.text('A. Option A'), findsNothing);
    expect(find.textContaining('Options hidden'), findsOneWidget);

    await tester.tap(find.textContaining('Options hidden'));
    await tester.pump();

    expect(find.text('A. Option A'), findsOneWidget);
  });

  testWidgets('correct submission shows the First attempt badge and Next', (
    tester,
  ) async {
    final sessions = _FakeSessionRepository(isFirstEverAttempt: true);
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: sessions,
          questionRepository: _FakeQuestionRepository(),
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('B. Option B'));
    await tester.pump();
    await tester.tap(find.text('High'));
    await tester.pump();
    await tester.tap(find.text('Submit answer'));
    await tester.pumpAndSettle();

    expect(find.text('First attempt'), findsOneWidget);
    expect(find.text('Correct'), findsOneWidget);
    expect(find.text('Next question'), findsOneWidget);
    expect(sessions.confidences.single, Confidence.high);
  });

  testWidgets(
    'shows Practice attempt badge and the incorrect tag on a wrong answer',
    (tester) async {
      final sessions = _FakeSessionRepository(isFirstEverAttempt: false);
      await tester.pumpWidget(
        _wrap(
          QuestionScreen(
            question: _question,
            mode: SessionMode.learn,
            sessionRepository: sessions,
            questionRepository: _FakeQuestionRepository(),
            aceRepository: _noopAceRepository(),
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text('A. Option A'));
      await tester.pump();
      await tester.tap(find.text('Low'));
      await tester.pump();
      await tester.tap(find.text('Submit answer'));
      await tester.pumpAndSettle();

      expect(find.text('Practice attempt'), findsOneWidget);
      expect(find.text('Your answer · Incorrect'), findsOneWidget);
      expect(find.text('Correct'), findsOneWidget); // still shown on option B
    },
  );

  testWidgets('tapping bookmark toggles the icon and calls the repository', (
    tester,
  ) async {
    final questions = _FakeQuestionRepository();
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(),
          questionRepository: questions,
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    expect(find.byIcon(Icons.bookmark_border_outlined), findsOneWidget);

    await tester.tap(find.byIcon(Icons.bookmark_border_outlined));
    await tester.pump();

    expect(find.byIcon(Icons.bookmark), findsOneWidget);
    expect(questions.toggleCount, 1);
  });

  testWidgets('shows an inline error and stays resubmittable if submit fails', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(fail: true),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('A. Option A'));
    await tester.pump();
    await tester.tap(find.text('Medium'));
    await tester.pump();
    await tester.tap(find.text('Submit answer'));
    await tester.pumpAndSettle();

    expect(
      find.text("Couldn't submit your answer. Try again."),
      findsOneWidget,
    );
    expect(_findButton(tester, 'Submit answer').onPressed, isNotNull);
  });

  testWidgets(
    'shows the explanation card and Ask Ace trigger after submission',
    (tester) async {
      // The explanation card pushes content past the default 800px test
      // viewport; ListView only builds children within its cache extent,
      // so widen it rather than dealing with scroll-to-find flakiness.
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _wrap(
          QuestionScreen(
            question: _question,
            mode: SessionMode.learn,
            sessionRepository: _FakeSessionRepository(
              explanation: const QuestionExplanation(
                summaryTakeaway: 'Key takeaway.',
                detailedExplanation: 'Detailed clinical reasoning.',
              ),
            ),
            questionRepository: _FakeQuestionRepository(),
            aceRepository: _noopAceRepository(),
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text('B. Option B'));
      await tester.pump();
      await tester.tap(find.text('High'));
      await tester.pump();
      await tester.tap(find.text('Submit answer'));
      await tester.pumpAndSettle();

      expect(find.text('Key takeaway.'), findsOneWidget);
      expect(find.text('Detailed clinical reasoning.'), findsOneWidget);
      expect(find.text('Ask Ace about this question'), findsOneWidget);
    },
  );

  testWidgets('hides the Ask Ace trigger when there is no explanation', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: _noopAceRepository(),
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('B. Option B'));
    await tester.pump();
    await tester.tap(find.text('High'));
    await tester.pump();
    await tester.tap(find.text('Submit answer'));
    await tester.pumpAndSettle();

    expect(find.text('Ask Ace about this question'), findsNothing);
  });

  testWidgets('opens the Ask Ace sheet and sends a message', (tester) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final ace = _FakeAceRepository();
    await tester.pumpWidget(
      _wrap(
        QuestionScreen(
          question: _question,
          mode: SessionMode.learn,
          sessionRepository: _FakeSessionRepository(
            explanation: const QuestionExplanation(
              summaryTakeaway: 'Key takeaway.',
              detailedExplanation: 'Detailed clinical reasoning.',
            ),
          ),
          questionRepository: _FakeQuestionRepository(),
          aceRepository: ace,
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('B. Option B'));
    await tester.pump();
    await tester.tap(find.text('High'));
    await tester.pump();
    await tester.tap(find.text('Submit answer'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ask Ace about this question'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(AceInput, 'Your question'),
      'Why is this the right first-line choice?',
    );
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(
      find.text('Why is this the right first-line choice?'),
      findsOneWidget,
    );
    expect(
      find.text('Ace reply to: Why is this the right first-line choice?'),
      findsOneWidget,
    );
    expect(ace.prompts.single, 'Why is this the right first-line choice?');
    expect(
      find.text('— Cardiovascular Therapeutics — subtopic notes'),
      findsOneWidget,
    );
  });

  testWidgets(
    'renders a deterministic refusal distinctly from a normal answer',
    (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _wrap(
          QuestionScreen(
            question: _question,
            mode: SessionMode.learn,
            sessionRepository: _FakeSessionRepository(
              explanation: const QuestionExplanation(
                summaryTakeaway: 'Key takeaway.',
                detailedExplanation: 'Detailed clinical reasoning.',
              ),
            ),
            questionRepository: _FakeQuestionRepository(),
            aceRepository: _FakeAceRepository(refuse: true),
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text('B. Option B'));
      await tester.pump();
      await tester.tap(find.text('High'));
      await tester.pump();
      await tester.tap(find.text('Submit answer'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Ask Ace about this question'));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.widgetWithText(AceInput, 'Your question'),
        'What is the stock price of AstraZeneca today?',
      );
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      expect(find.text('Outside reviewed curriculum'), findsOneWidget);

      final bubble = tester.widget<Container>(
        find
            .ancestor(
              of: find.text('Outside reviewed curriculum'),
              matching: find.byType(Container),
            )
            .first,
      );
      final decoration = bubble.decoration as BoxDecoration;
      expect(decoration.color, AceColors.canvas);
    },
  );
}
