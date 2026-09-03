import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../weekly_insight.dart';
import '../weekly_insight_repository.dart';

/// "Weekly Ace Clinical Insight" dashboard card. Reads the pre-computed
/// takeaway from `GET /api/v1/ace/weekly-insight` — the paragraph itself
/// always comes from the server-side weekly cron over Cloudflare D1, never
/// generated on-device.
class WeeklyInsightCard extends StatefulWidget {
  const WeeklyInsightCard({super.key, required this.repository, this.userId});

  final WeeklyInsightRepository repository;
  final String? userId;

  @override
  State<WeeklyInsightCard> createState() => _WeeklyInsightCardState();
}

class _WeeklyInsightCardState extends State<WeeklyInsightCard> {
  late Future<WeeklyInsight> _future = widget.repository.fetch(
    userId: widget.userId,
  );

  void _retry() {
    setState(() {
      _future = widget.repository.fetch(userId: widget.userId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AceCard(
      child: FutureBuilder<WeeklyInsight>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const _LoadingBody();
          }
          if (snapshot.hasError) {
            return _ErrorBody(onRetry: _retry);
          }
          return _InsightBody(insight: snapshot.data!);
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
          "Loading this week's insight…",
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
            "Couldn't load this week's insight.",
            style: TextStyle(color: AceColors.dangerRose),
          ),
        ),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ],
    );
  }
}

class _InsightBody extends StatelessWidget {
  const _InsightBody({required this.insight});

  final WeeklyInsight insight;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.auto_awesome,
              size: 16,
              color: AceColors.aceIndigo,
            ),
            const SizedBox(width: AceSpacing.xs),
            Expanded(
              child: Text(
                'Weekly Ace Clinical Insight',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AceColors.deepIndigo,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            if (insight.confidentlyIncorrectCount > 0)
              AceBadge(
                label: '${insight.confidentlyIncorrectCount} to review',
                variant: AceBadgeVariant.danger,
              ),
          ],
        ),
        const SizedBox(height: AceSpacing.sm),
        Text(
          insight.insightParagraph,
          style: const TextStyle(color: AceColors.ink, height: 1.4),
        ),
        if (!insight.isPersonalized) ...[
          const SizedBox(height: AceSpacing.sm),
          const Text(
            'Complete a few sessions to unlock a personalised insight next '
            'week.',
            style: TextStyle(fontSize: 12, color: AceColors.slateLight),
          ),
        ],
      ],
    );
  }
}
