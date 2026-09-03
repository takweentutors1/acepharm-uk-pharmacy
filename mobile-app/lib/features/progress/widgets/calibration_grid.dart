import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../progress_metrics.dart';

/// Pillar 4: stated confidence vs actual correctness across the three
/// bands, plus the server's overall calibration verdict — always shown
/// as an icon + label + colour together, never colour alone.
class CalibrationGrid extends StatelessWidget {
  const CalibrationGrid({
    super.key,
    required this.low,
    required this.medium,
    required this.high,
    required this.summary,
  });

  final ConfidenceBucket low;
  final ConfidenceBucket medium;
  final ConfidenceBucket high;
  final CalibrationSummary summary;

  static const _summaryMeta = {
    CalibrationSummary.overconfident: (
      label: 'Overconfident',
      variant: AceBadgeVariant.danger,
      icon: Icons.trending_down,
      detail:
          'High-confidence answers are scoring below 70% — treat a '
          'confident guess with extra caution.',
    ),
    CalibrationSummary.underconfident: (
      label: 'Underconfident',
      variant: AceBadgeVariant.info,
      icon: Icons.trending_up,
      detail:
          'Low-confidence answers are scoring above 70% — you often know '
          'more than you think.',
    ),
    CalibrationSummary.calibrated: (
      label: 'Calibrated',
      variant: AceBadgeVariant.success,
      icon: Icons.check_circle_outline,
      detail: 'Stated confidence broadly tracks actual accuracy.',
    ),
  };

  @override
  Widget build(BuildContext context) {
    final meta = _summaryMeta[summary]!;

    return Container(
      padding: const EdgeInsets.all(AceSpacing.lg),
      decoration: BoxDecoration(
        color: AceColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AceColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Confidence Calibration',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AceColors.slate,
            ),
          ),
          const SizedBox(height: AceSpacing.sm),
          AceBadge(label: meta.label, variant: meta.variant, icon: meta.icon),
          const SizedBox(height: AceSpacing.xs),
          Text(
            meta.detail,
            style: const TextStyle(fontSize: 12, color: AceColors.slateLight),
          ),
          const SizedBox(height: AceSpacing.lg),
          _CalibrationRow(label: 'Low confidence', bucket: low),
          const SizedBox(height: AceSpacing.sm),
          _CalibrationRow(label: 'Medium confidence', bucket: medium),
          const SizedBox(height: AceSpacing.sm),
          _CalibrationRow(label: 'High confidence', bucket: high),
        ],
      ),
    );
  }
}

class _CalibrationRow extends StatelessWidget {
  const _CalibrationRow({required this.label, required this.bucket});

  final String label;
  final ConfidenceBucket bucket;

  @override
  Widget build(BuildContext context) {
    final hasData = bucket.total > 0;
    return Row(
      children: [
        Expanded(
          child: Text(label, style: const TextStyle(color: AceColors.ink)),
        ),
        Text(
          hasData ? '${bucket.accuracy}% accurate' : 'No attempts',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AceColors.ink,
          ),
        ),
        const SizedBox(width: AceSpacing.sm),
        Text(
          hasData ? '(${bucket.total})' : '',
          style: const TextStyle(fontSize: 12, color: AceColors.slateLight),
        ),
      ],
    );
  }
}
