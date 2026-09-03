import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../mastery_status.dart';
import '../progress_metrics.dart';

/// The 19-topic mastery grid: every subtopic across every category, each
/// carrying one of the 6 status labels — always shown as icon + text +
/// colour together, never colour alone.
class MasteryGrid extends StatelessWidget {
  const MasteryGrid({super.key, required this.categories});

  final List<CategoryCoverage> categories;

  static const _statusMeta = {
    MasteryStatus.notStarted: (
      variant: AceBadgeVariant.neutral,
      icon: Icons.radio_button_unchecked,
    ),
    MasteryStatus.firstPass: (
      variant: AceBadgeVariant.info,
      icon: Icons.flag_outlined,
    ),
    MasteryStatus.developing: (
      variant: AceBadgeVariant.info,
      icon: Icons.trending_up,
    ),
    MasteryStatus.needsAttention: (
      variant: AceBadgeVariant.danger,
      icon: Icons.priority_high,
    ),
    MasteryStatus.dueForReview: (
      variant: AceBadgeVariant.danger,
      icon: Icons.history,
    ),
    MasteryStatus.secure: (
      variant: AceBadgeVariant.success,
      icon: Icons.verified_outlined,
    ),
  };

  @override
  Widget build(BuildContext context) {
    final totalSubtopics = categories.fold<int>(
      0,
      (sum, c) => sum + c.subtopics.length,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Curriculum Mastery ($totalSubtopics topics)',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: AceSpacing.sm),
        for (final category in categories)
          if (category.subtopics.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: AceSpacing.sm),
              child: _CategorySection(category: category),
            ),
      ],
    );
  }
}

class _CategorySection extends StatelessWidget {
  const _CategorySection({required this.category});

  final CategoryCoverage category;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AceColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AceColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            category.categoryName,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AceColors.ink,
            ),
          ),
          subtitle: Text(
            '${category.attemptedQuestions}/${category.totalQuestions} '
            'questions attempted',
            style: const TextStyle(fontSize: 12, color: AceColors.slateLight),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(
            AceSpacing.lg,
            0,
            AceSpacing.lg,
            AceSpacing.sm,
          ),
          children: [
            for (final subtopic in category.subtopics)
              _SubtopicRow(subtopic: subtopic),
          ],
        ),
      ),
    );
  }
}

class _SubtopicRow extends StatelessWidget {
  const _SubtopicRow({required this.subtopic});

  final SubtopicMastery subtopic;

  @override
  Widget build(BuildContext context) {
    final meta = MasteryGrid._statusMeta[subtopic.status]!;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AceSpacing.xs),
      child: Row(
        children: [
          Expanded(
            child: Text(
              subtopic.name,
              style: const TextStyle(color: AceColors.ink),
            ),
          ),
          const SizedBox(width: AceSpacing.sm),
          AceBadge(
            label: subtopic.status.label,
            variant: meta.variant,
            icon: meta.icon,
          ),
        ],
      ),
    );
  }
}
