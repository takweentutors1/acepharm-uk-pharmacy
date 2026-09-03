import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../answer_result.dart';
import '../question.dart';

/// The option list for a question. Handles three states:
///  - covered (active-recall): options are hidden behind a reveal prompt.
///  - pre-submission: selectable rows, neutral indigo highlight only —
///    absolutely no green/red before [result] exists (product invariant #1).
///  - post-submission: correctness colour + icon + label on every option
///    (never colour alone), plus each option's own rationale.
class QuestionOptionList extends StatelessWidget {
  const QuestionOptionList({
    super.key,
    required this.options,
    required this.selectedOptionId,
    required this.onSelect,
    required this.result,
    required this.isCovered,
    required this.onRevealCovered,
  });

  final List<QuestionOption> options;
  final String? selectedOptionId;
  final ValueChanged<String>? onSelect;
  final AnswerResult? result;
  final bool isCovered;
  final VoidCallback onRevealCovered;

  @override
  Widget build(BuildContext context) {
    if (isCovered) {
      return _CoveredPrompt(onReveal: onRevealCovered);
    }

    final sorted = [...options]
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return Column(
      children: [
        for (final option in sorted)
          Padding(
            padding: const EdgeInsets.only(bottom: AceSpacing.sm),
            child: _OptionTile(
              option: option,
              isSelected: option.id == selectedOptionId,
              result: result,
              onTap: onSelect == null ? null : () => onSelect!(option.id),
            ),
          ),
      ],
    );
  }
}

class _CoveredPrompt extends StatelessWidget {
  const _CoveredPrompt({required this.onReveal});

  final VoidCallback onReveal;

  @override
  Widget build(BuildContext context) {
    return AceCard(
      onTap: onReveal,
      child: const Row(
        children: [
          Icon(Icons.visibility_off_outlined, color: AceColors.slate),
          SizedBox(width: AceSpacing.md),
          Expanded(
            child: Text(
              'Options hidden for active recall. Tap to reveal when '
              "you've settled on an answer.",
              style: TextStyle(color: AceColors.slate),
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.option,
    required this.isSelected,
    required this.result,
    required this.onTap,
  });

  final QuestionOption option;
  final bool isSelected;
  final AnswerResult? result;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    if (result == null) {
      return AceCard(
        selected: isSelected,
        onTap: onTap,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              size: 20,
              color: isSelected ? AceColors.aceIndigo : AceColors.slateLight,
            ),
            const SizedBox(width: AceSpacing.md),
            Expanded(child: Text('${option.label}. ${option.content}')),
          ],
        ),
      );
    }

    final isCorrectOption = option.id == result!.correctOptionId;
    final rationale = result!.rationaleFor(option.id) ?? option.rationale;

    final (Color border, Color accent, IconData icon, String tag) = switch ((
      isCorrectOption,
      isSelected,
    )) {
      (true, _) => (
        AceColors.teal,
        AceColors.teal,
        Icons.check_circle,
        'Correct',
      ),
      (false, true) => (
        AceColors.dangerRose,
        AceColors.dangerRose,
        Icons.cancel,
        'Your answer · Incorrect',
      ),
      (false, false) => (
        AceColors.border,
        AceColors.slateLight,
        Icons.circle_outlined,
        '',
      ),
    };

    return Container(
      padding: const EdgeInsets.all(AceSpacing.lg),
      decoration: BoxDecoration(
        color: AceColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: border,
          width: isCorrectOption || isSelected ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: accent),
              const SizedBox(width: AceSpacing.md),
              Expanded(child: Text('${option.label}. ${option.content}')),
            ],
          ),
          if (tag.isNotEmpty) ...[
            const SizedBox(height: AceSpacing.xs),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Text(
                tag,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: accent,
                ),
              ),
            ),
          ],
          if (rationale.isNotEmpty) ...[
            const SizedBox(height: AceSpacing.xs),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Text(
                rationale,
                style: const TextStyle(fontSize: 13, color: AceColors.slate),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
