import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../training_stage.dart';

/// Step 1: training stage selection.
class StageStep extends StatelessWidget {
  const StageStep({super.key, required this.value, required this.onChanged});

  final TrainingStage? value;
  final ValueChanged<TrainingStage> onChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AceSpacing.lg),
      children: [
        Text(
          'Where are you in your training?',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AceSpacing.xs),
        const Text(
          'This helps Ace tailor recommendations to your stage.',
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.xl),
        for (final stage in TrainingStage.values)
          Padding(
            padding: const EdgeInsets.only(bottom: AceSpacing.sm),
            child: AceCard(
              selected: value == stage,
              onTap: () => onChanged(stage),
              child: Row(
                children: [
                  Icon(
                    value == stage
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked,
                    color: value == stage
                        ? AceColors.aceIndigo
                        : AceColors.slateLight,
                  ),
                  const SizedBox(width: AceSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stage.label,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AceColors.ink,
                          ),
                        ),
                        Text(
                          stage.description,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AceColors.slateLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
