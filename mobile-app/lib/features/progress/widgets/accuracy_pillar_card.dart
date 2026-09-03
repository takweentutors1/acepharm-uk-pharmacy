import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../progress_metrics.dart';

/// One of the five analytics pillars. [prominent] gives first-attempt
/// accuracy its required visual emphasis over practice/repeat — same
/// data shape, deliberately different weight, never a shared number.
class AccuracyPillarCard extends StatelessWidget {
  const AccuracyPillarCard({
    super.key,
    required this.title,
    required this.bucket,
    this.subtitle,
    this.prominent = false,
    this.unitLabel = 'correct',
  });

  final String title;
  final AccuracyBucket bucket;
  final String? subtitle;
  final bool prominent;
  final String unitLabel;

  @override
  Widget build(BuildContext context) {
    final hasData = bucket.total > 0;

    return Container(
      padding: EdgeInsets.all(prominent ? AceSpacing.xl : AceSpacing.lg),
      decoration: BoxDecoration(
        color: prominent ? AceColors.indigoWash : AceColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: prominent ? AceColors.aceIndigo : AceColors.border,
          width: prominent ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: prominent ? 14 : 12,
              fontWeight: FontWeight.w700,
              color: prominent ? AceColors.deepIndigo : AceColors.slate,
            ),
          ),
          const SizedBox(height: AceSpacing.xs),
          Text(
            hasData ? '${bucket.percentage}%' : '—',
            style: TextStyle(
              fontSize: prominent ? 44 : 28,
              fontWeight: FontWeight.w800,
              color: AceColors.ink,
              height: 1,
            ),
          ),
          const SizedBox(height: AceSpacing.xs),
          Text(
            hasData
                ? '${bucket.correct}/${bucket.total} $unitLabel'
                : (subtitle ?? 'No attempts yet'),
            style: const TextStyle(fontSize: 12, color: AceColors.slateLight),
          ),
        ],
      ),
    );
  }
}
