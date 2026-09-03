import 'package:flutter/material.dart';

import '../../../core/widgets/widgets.dart';

/// Surfaces the server's dual-store distinction directly in the UI: a
/// question is either this learner's very first attempt (isolated in
/// `question_first_attempts` for calibration analytics) or a subsequent
/// practice rep (`question_attempts` only). The client never computes
/// this — it only displays what the server already decided.
class FirstAttemptBadge extends StatelessWidget {
  const FirstAttemptBadge({super.key, required this.isFirstEverAttempt});

  final bool isFirstEverAttempt;

  @override
  Widget build(BuildContext context) {
    return AceBadge(
      label: isFirstEverAttempt ? 'First attempt' : 'Practice attempt',
      variant: isFirstEverAttempt
          ? AceBadgeVariant.info
          : AceBadgeVariant.neutral,
      icon: isFirstEverAttempt ? Icons.flag_outlined : Icons.replay,
    );
  }
}
