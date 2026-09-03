import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/theme/ace_typography.dart';
import '../../core/widgets/widgets.dart';
import 'ace_repository.dart';
import 'answer_result.dart';
import 'confidence.dart';
import 'question.dart';
import 'question_repository.dart';
import 'session_mode.dart';
import 'session_repository.dart';
import 'widgets/ask_ace_sheet.dart';
import 'widgets/confidence_selector.dart';
import 'widgets/first_attempt_badge.dart';
import 'widgets/note_editor_sheet.dart';
import 'widgets/question_option_list.dart';

/// The core question-practice screen: pre-submission confidence capture,
/// the active-recall "Cover Options" toggle, bookmarking, personal notes,
/// and — once answered — the server's isolated first-attempt vs practice
/// telemetry distinction.
class QuestionScreen extends StatefulWidget {
  const QuestionScreen({
    super.key,
    required this.question,
    required this.mode,
    required this.sessionRepository,
    required this.questionRepository,
    required this.aceRepository,
    this.sessionId,
    this.userId,
    this.onNext,
  });

  final PracticeQuestion question;
  final SessionMode mode;
  final SessionRepository sessionRepository;
  final QuestionRepository questionRepository;
  final AceRepository aceRepository;
  final String? sessionId;
  final String? userId;
  final VoidCallback? onNext;

  @override
  State<QuestionScreen> createState() => _QuestionScreenState();
}

class _QuestionScreenState extends State<QuestionScreen> {
  final DateTime _startedAt = DateTime.now();

  String? _selectedOptionId;
  Confidence? _confidence;
  bool _isCovered = false;

  bool _isSubmitting = false;
  bool _isBookmarking = false;
  bool? _isBookmarked;
  AnswerResult? _result;
  String? _submitError;

  bool get _canSubmit =>
      !_isSubmitting &&
      _result == null &&
      _selectedOptionId != null &&
      _confidence != null;

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() {
      _isSubmitting = true;
      _submitError = null;
    });
    final elapsed = DateTime.now().difference(_startedAt).inSeconds;
    try {
      final result = await widget.sessionRepository.submitAnswer(
        sessionId: widget.sessionId,
        questionId: widget.question.id,
        questionVersion: widget.question.version,
        selectedOptionId: _selectedOptionId!,
        confidence: _confidence,
        timeTakenSeconds: elapsed,
        mode: widget.mode,
      );
      if (!mounted) return;
      setState(() => _result = result);
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitError = "Couldn't submit your answer. Try again.");
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _toggleBookmark() async {
    setState(() => _isBookmarking = true);
    try {
      final bookmarked = await widget.questionRepository.toggleBookmark(
        widget.question.id,
      );
      if (!mounted) return;
      setState(() => _isBookmarked = bookmarked);
    } catch (_) {
      // Non-critical — don't block the question flow on a bookmark failure.
    } finally {
      if (mounted) setState(() => _isBookmarking = false);
    }
  }

  void _openNotes() {
    showNoteEditorSheet(
      context: context,
      questionRepository: widget.questionRepository,
      questionId: widget.question.id,
    );
  }

  void _openAskAce() {
    showAskAceSheet(
      context: context,
      aceRepository: widget.aceRepository,
      questionId: widget.question.id,
      userId: widget.userId,
    );
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.question;

    return Scaffold(
      appBar: AppBar(
        title: Text(question.publicId, style: AceTypography.mono()),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked == true
                  ? Icons.bookmark
                  : Icons.bookmark_border_outlined,
              color: _isBookmarked == true ? AceColors.aceIndigo : null,
            ),
            onPressed: _isBookmarking ? null : _toggleBookmark,
          ),
          IconButton(
            icon: const Icon(Icons.edit_note_outlined),
            onPressed: _openNotes,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(AceSpacing.lg),
              children: [
                if (_result != null) ...[
                  FirstAttemptBadge(
                    isFirstEverAttempt: _result!.isFirstEverAttempt,
                  ),
                  const SizedBox(height: AceSpacing.md),
                ],
                Text(
                  question.content.stem,
                  style: const TextStyle(color: AceColors.ink, height: 1.4),
                ),
                const SizedBox(height: AceSpacing.sm),
                Text(
                  question.content.leadIn,
                  style: const TextStyle(
                    color: AceColors.ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AceSpacing.lg),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Cover options',
                      style: TextStyle(
                        color: AceColors.slate,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Switch(
                      value: _isCovered,
                      onChanged: _result != null
                          ? null
                          : (value) => setState(() => _isCovered = value),
                    ),
                  ],
                ),
                const SizedBox(height: AceSpacing.sm),
                QuestionOptionList(
                  options: question.options,
                  selectedOptionId: _selectedOptionId,
                  onSelect: _result != null
                      ? null
                      : (id) => setState(() => _selectedOptionId = id),
                  result: _result,
                  isCovered: _isCovered && _result == null,
                  onRevealCovered: () => setState(() => _isCovered = false),
                ),
                if (_result?.explanation case final explanation?) ...[
                  const SizedBox(height: AceSpacing.lg),
                  _ExplanationCard(explanation: explanation),
                  const SizedBox(height: AceSpacing.sm),
                  AceButton(
                    label: 'Ask Ace about this question',
                    variant: AceButtonVariant.secondary,
                    icon: Icons.auto_awesome,
                    onPressed: _openAskAce,
                  ),
                ],
                if (_result == null) ...[
                  const SizedBox(height: AceSpacing.xl),
                  const Text(
                    'How confident are you?',
                    style: TextStyle(
                      color: AceColors.slate,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AceSpacing.sm),
                  ConfidenceSelector(
                    value: _confidence,
                    onChanged: (confidence) =>
                        setState(() => _confidence = confidence),
                  ),
                ],
                if (_submitError != null) ...[
                  const SizedBox(height: AceSpacing.sm),
                  Text(
                    _submitError!,
                    style: const TextStyle(
                      color: AceColors.dangerRose,
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
          _QuestionFooter(
            hasResult: _result != null,
            canSubmit: _canSubmit,
            isSubmitting: _isSubmitting,
            onSubmit: _submit,
            onNext: widget.onNext,
          ),
        ],
      ),
    );
  }
}

class _QuestionFooter extends StatelessWidget {
  const _QuestionFooter({
    required this.hasResult,
    required this.canSubmit,
    required this.isSubmitting,
    required this.onSubmit,
    required this.onNext,
  });

  final bool hasResult;
  final bool canSubmit;
  final bool isSubmitting;
  final VoidCallback onSubmit;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AceSpacing.lg),
        decoration: const BoxDecoration(
          color: AceColors.surface,
          border: Border(top: BorderSide(color: AceColors.border)),
        ),
        child: hasResult
            ? AceButton(label: 'Next question', onPressed: onNext)
            : AceButton(
                label: 'Submit answer',
                isLoading: isSubmitting,
                onPressed: canSubmit ? onSubmit : null,
              ),
      ),
    );
  }
}

class _ExplanationCard extends StatelessWidget {
  const _ExplanationCard({required this.explanation});

  final QuestionExplanation explanation;

  @override
  Widget build(BuildContext context) {
    return AceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            explanation.summaryTakeaway,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AceColors.ink,
            ),
          ),
          const SizedBox(height: AceSpacing.sm),
          Text(
            explanation.detailedExplanation,
            style: const TextStyle(color: AceColors.slate, height: 1.4),
          ),
          if (explanation.clinicalGuidanceReference != null) ...[
            const SizedBox(height: AceSpacing.sm),
            Text(
              explanation.clinicalGuidanceReference!,
              style: const TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: AceColors.slateLight,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
