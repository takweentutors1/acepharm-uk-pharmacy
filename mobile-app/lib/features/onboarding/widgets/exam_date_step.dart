import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';

/// Step 3: exam date, with a live countdown ticker once picked.
class ExamDateStep extends StatelessWidget {
  const ExamDateStep({
    super.key,
    required this.value,
    required this.onChanged,
    this.now,
  });

  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  /// Injectable for tests; defaults to [DateTime.now] in the real app.
  final DateTime? now;

  Future<void> _pickDate(BuildContext context) async {
    final today = now ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: value ?? today.add(const Duration(days: 90)),
      firstDate: today,
      lastDate: today.add(const Duration(days: 365 * 3)),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final today = now ?? DateTime.now();
    final daysRemaining = value
        ?.difference(DateTime(today.year, today.month, today.day))
        .inDays;

    return ListView(
      padding: const EdgeInsets.all(AceSpacing.lg),
      children: [
        Text(
          'When is your exam or assessment?',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AceSpacing.xs),
        const Text(
          "Optional — you can add or change this later.",
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.xl),
        AceCard(
          onTap: () => _pickDate(context),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                color: AceColors.aceIndigo,
              ),
              const SizedBox(width: AceSpacing.md),
              Expanded(
                child: Text(
                  value == null
                      ? 'Select a date'
                      : '${value!.day}/${value!.month}/${value!.year}',
                  style: const TextStyle(
                    color: AceColors.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (daysRemaining != null) ...[
          const SizedBox(height: AceSpacing.lg),
          Container(
            padding: const EdgeInsets.all(AceSpacing.lg),
            decoration: BoxDecoration(
              color: AceColors.indigoWash,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  '${daysRemaining > 0 ? daysRemaining : 0}',
                  style: const TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w800,
                    color: AceColors.deepIndigo,
                  ),
                ),
                Text(
                  daysRemaining > 0 ? 'days to go' : "It's today!",
                  style: const TextStyle(
                    color: AceColors.deepIndigo,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
