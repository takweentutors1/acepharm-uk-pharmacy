import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';

/// Step 4: daily question goal, default 20.
class DailyGoalStep extends StatelessWidget {
  const DailyGoalStep({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final int value;
  final ValueChanged<int> onChanged;

  static const minValue = 5;
  static const maxValue = 100;
  static const step = 5;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AceSpacing.lg),
      children: [
        Text(
          'Set your daily question goal',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AceSpacing.xs),
        const Text(
          'You can change this any time in settings.',
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.xxl),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton.filledTonal(
              onPressed: value > minValue
                  ? () => onChanged(value - step)
                  : null,
              icon: const Icon(Icons.remove),
            ),
            SizedBox(
              width: 100,
              child: Text(
                '$value',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: AceColors.ink,
                ),
              ),
            ),
            IconButton.filledTonal(
              onPressed: value < maxValue
                  ? () => onChanged(value + step)
                  : null,
              icon: const Icon(Icons.add),
            ),
          ],
        ),
        const SizedBox(height: AceSpacing.sm),
        const Center(
          child: Text(
            'questions per day',
            style: TextStyle(color: AceColors.slateLight),
          ),
        ),
      ],
    );
  }
}
