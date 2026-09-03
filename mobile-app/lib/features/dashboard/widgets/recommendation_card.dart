import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../recommendation.dart';
import '../recommendation_repository.dart';

/// "Recommended Next Session" dashboard card. Every recommendation the
/// server returns carries a [Recommendation.reasonText] explaining *why*
/// — this widget always renders it alongside the suggestion. If the fetch
/// fails, it fails closed to an error/retry state rather than ever
/// showing a session suggestion with no explanation.
class RecommendationCard extends StatefulWidget {
  const RecommendationCard({
    super.key,
    required this.repository,
    this.onStartSession,
  });

  final RecommendationRepository repository;
  final ValueChanged<Recommendation>? onStartSession;

  @override
  State<RecommendationCard> createState() => _RecommendationCardState();
}

class _RecommendationCardState extends State<RecommendationCard> {
  late Future<Recommendation> _future = widget.repository.fetch();

  void _retry() {
    setState(() {
      _future = widget.repository.fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AceCard(
      child: FutureBuilder<Recommendation>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const _LoadingBody();
          }
          if (snapshot.hasError) {
            return _ErrorBody(onRetry: _retry);
          }
          return _RecommendationBody(
            recommendation: snapshot.data!,
            onStartSession: widget.onStartSession,
          );
        },
      ),
    );
  }
}

class _LoadingBody extends StatelessWidget {
  const _LoadingBody();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
        SizedBox(width: AceSpacing.sm),
        Text(
          'Finding your next recommended session…',
          style: TextStyle(color: AceColors.slate),
        ),
      ],
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Text(
            "Couldn't load a recommendation.",
            style: TextStyle(color: AceColors.dangerRose),
          ),
        ),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ],
    );
  }
}

class _RecommendationBody extends StatelessWidget {
  const _RecommendationBody({
    required this.recommendation,
    required this.onStartSession,
  });

  final Recommendation recommendation;
  final ValueChanged<Recommendation>? onStartSession;

  static const _meta = {
    RecommendationReason.weakAccuracy: (
      label: 'Focus area',
      variant: AceBadgeVariant.danger,
      icon: Icons.track_changes,
    ),
    RecommendationReason.dueForReview: (
      label: 'Due for review',
      variant: AceBadgeVariant.info,
      icon: Icons.history,
    ),
    RecommendationReason.lowCoverage: (
      label: 'Coverage gap',
      variant: AceBadgeVariant.info,
      icon: Icons.explore_outlined,
    ),
    RecommendationReason.mostUnseen: (
      label: 'New topic',
      variant: AceBadgeVariant.neutral,
      icon: Icons.auto_awesome,
    ),
  };

  @override
  Widget build(BuildContext context) {
    final meta = _meta[recommendation.reason]!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AceBadge(label: meta.label, variant: meta.variant, icon: meta.icon),
        const SizedBox(height: AceSpacing.sm),
        Text(
          recommendation.subtopicName,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        Text(
          recommendation.categoryName,
          style: const TextStyle(color: AceColors.slate, fontSize: 13),
        ),
        const SizedBox(height: AceSpacing.sm),
        Text(
          recommendation.reasonText,
          style: const TextStyle(color: AceColors.ink, height: 1.4),
        ),
        const SizedBox(height: AceSpacing.lg),
        AceButton(
          label:
              'Start session · '
              '${recommendation.recommendedQuestionCount} questions',
          onPressed: onStartSession == null
              ? null
              : () => onStartSession!(recommendation),
        ),
      ],
    );
  }
}
