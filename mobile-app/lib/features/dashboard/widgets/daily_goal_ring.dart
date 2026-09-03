import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../daily_goal.dart';
import '../daily_goal_repository.dart';
import 'revision_ring.dart';

/// Fetches the real, timezone-aware daily progress from
/// `GET /api/v1/analytics/daily-goal` and feeds it into [RevisionRing] —
/// the ring itself is a pure display widget with no knowledge of where
/// its numbers come from.
class DailyGoalRing extends StatefulWidget {
  const DailyGoalRing({super.key, required this.repository});

  final DailyGoalRepository repository;

  @override
  State<DailyGoalRing> createState() => _DailyGoalRingState();
}

class _DailyGoalRingState extends State<DailyGoalRing> {
  late Future<DailyGoal> _future = widget.repository.fetch();

  void _retry() {
    setState(() {
      _future = widget.repository.fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<DailyGoal>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            width: 160,
            height: 160,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }
        if (snapshot.hasError) {
          return SizedBox(
            width: 160,
            height: 160,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Couldn't load today's progress.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AceColors.dangerRose, fontSize: 12),
                  ),
                  TextButton(onPressed: _retry, child: const Text('Retry')),
                ],
              ),
            ),
          );
        }
        final goal = snapshot.data!;
        return RevisionRing(
          completed: goal.answeredToday,
          target: goal.dailyTarget,
        );
      },
    );
  }
}
