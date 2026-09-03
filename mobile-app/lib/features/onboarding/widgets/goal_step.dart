import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';

const goalPresets = [
  'GPhC Registration Assessment',
  'MPharm Progression Exams',
  'OSCE / Practical Assessment',
  'Other',
];

/// Step 2: primary revision target.
class GoalStep extends StatelessWidget {
  const GoalStep({
    super.key,
    required this.value,
    required this.customController,
    required this.onChanged,
  });

  final String? value;
  final TextEditingController customController;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AceSpacing.lg),
      children: [
        Text(
          'What are you revising for?',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AceSpacing.xl),
        for (final goal in goalPresets)
          Padding(
            padding: const EdgeInsets.only(bottom: AceSpacing.sm),
            child: AceCard(
              selected: value == goal,
              onTap: () => onChanged(goal),
              child: Text(goal, style: const TextStyle(color: AceColors.ink)),
            ),
          ),
        if (value == 'Other') ...[
          const SizedBox(height: AceSpacing.sm),
          AceInput(
            label: "Tell us what you're revising for",
            controller: customController,
            // Re-notifies the parent on every keystroke so it rebuilds
            // and re-evaluates whether Continue should be enabled —
            // typing alone doesn't otherwise trigger the parent's
            // setState.
            onChanged: (_) => onChanged('Other'),
          ),
        ],
      ],
    );
  }
}
