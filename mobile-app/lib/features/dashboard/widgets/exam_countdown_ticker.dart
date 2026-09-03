import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';

/// Persistent exam countdown, set once in onboarding step 3 and shown
/// on every dashboard visit thereafter — not just flashed once during
/// onboarding. Renders nothing if no exam date was set (it's optional).
class ExamCountdownTicker extends StatelessWidget {
  const ExamCountdownTicker({
    super.key,
    required this.assessmentDate,
    this.now,
  });

  final DateTime? assessmentDate;

  /// Injectable for tests; defaults to [DateTime.now] in the real app.
  final DateTime? now;

  @override
  Widget build(BuildContext context) {
    final date = assessmentDate;
    if (date == null) return const SizedBox.shrink();

    final today = now ?? DateTime.now();
    final daysRemaining = date
        .difference(DateTime(today.year, today.month, today.day))
        .inDays;

    final String headline;
    final String caption;
    if (daysRemaining > 0) {
      headline = '$daysRemaining';
      caption = daysRemaining == 1 ? 'day to your exam' : 'days to your exam';
    } else if (daysRemaining == 0) {
      headline = 'Today';
      caption = 'is your exam day';
    } else {
      headline = 'Exam date passed';
      caption = '${date.day}/${date.month}/${date.year}';
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AceSpacing.lg,
        vertical: AceSpacing.md,
      ),
      decoration: BoxDecoration(
        color: AceColors.indigoWash,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.timer_outlined, color: AceColors.deepIndigo),
          const SizedBox(width: AceSpacing.md),
          Expanded(
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '$headline ',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      color: AceColors.deepIndigo,
                    ),
                  ),
                  TextSpan(
                    text: caption,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AceColors.deepIndigo,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
