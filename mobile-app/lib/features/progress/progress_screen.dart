import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import 'progress_metrics.dart';
import 'progress_repository.dart';
import 'widgets/accuracy_pillar_card.dart';
import 'widgets/calibration_grid.dart';
import 'widgets/mastery_grid.dart';

/// The five separate analytics pillars (product invariant #5): first-
/// attempt accuracy, practice accuracy, repeat accuracy, confidence
/// calibration, and curriculum coverage. Kept visibly distinct — never
/// merged into one composite score.
class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key, required this.repository});

  final ProgressRepository repository;

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  late Future<ProgressMetrics> _future = widget.repository.fetchMetrics();

  void _retry() {
    setState(() {
      _future = widget.repository.fetchMetrics();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Progress')),
      body: FutureBuilder<ProgressMetrics>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AceSpacing.xl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      "Couldn't load your progress.",
                      style: TextStyle(color: AceColors.dangerRose),
                    ),
                    const SizedBox(height: AceSpacing.sm),
                    TextButton(onPressed: _retry, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }

          final metrics = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(AceSpacing.lg),
            children: [
              AccuracyPillarCard(
                title: 'First-Attempt Accuracy',
                bucket: metrics.firstAttempt,
                prominent: true,
              ),
              const SizedBox(height: AceSpacing.lg),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: AccuracyPillarCard(
                      title: 'Practice Accuracy',
                      bucket: metrics.practice,
                      subtitle: 'Includes every attempt',
                    ),
                  ),
                  const SizedBox(width: AceSpacing.md),
                  Expanded(
                    child: AccuracyPillarCard(
                      title: 'Repeat Accuracy',
                      bucket: metrics.repeat,
                      subtitle: 'From 2nd attempts on',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AceSpacing.lg),
              CalibrationGrid(
                low: metrics.lowConfidence,
                medium: metrics.mediumConfidence,
                high: metrics.highConfidence,
                summary: metrics.calibrationSummary,
              ),
              const SizedBox(height: AceSpacing.lg),
              AccuracyPillarCard(
                title: 'Curriculum Coverage',
                bucket: metrics.coverageBucket,
                unitLabel: 'questions attempted',
                subtitle: 'No questions in the curriculum yet',
              ),
              const SizedBox(height: AceSpacing.xl),
              MasteryGrid(categories: metrics.categoryCoverage),
            ],
          );
        },
      ),
    );
  }
}
