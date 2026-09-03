import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';

/// Circular daily-target progress tracker, e.g. "14/20 completed".
///
/// Animates the fill whenever [completed] changes so a live update (a
/// question submitted mid-session) reads as motion rather than a jump cut.
/// The count is always shown as text alongside the ring, and the "goal
/// complete" state adds an icon + label rather than relying on the colour
/// switch alone.
class RevisionRing extends StatelessWidget {
  const RevisionRing({
    super.key,
    required this.completed,
    required this.target,
    this.size = 160,
    this.strokeWidth = 14,
    this.label = 'completed today',
  });

  final int completed;
  final int target;
  final double size;
  final double strokeWidth;
  final String label;

  double get _progress {
    if (target <= 0) return 0;
    return (completed / target).clamp(0, 1);
  }

  @override
  Widget build(BuildContext context) {
    final isComplete = target > 0 && completed >= target;

    return SizedBox(
      width: size,
      height: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: _progress),
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeOutCubic,
        builder: (context, animatedProgress, _) {
          return CustomPaint(
            painter: _RingPainter(
              progress: animatedProgress,
              strokeWidth: strokeWidth,
              trackColor: AceColors.border,
              progressColor: isComplete ? AceColors.teal : AceColors.aceIndigo,
            ),
            child: Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: strokeWidth),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '$completed',
                            style: const TextStyle(
                              fontSize: 30,
                              fontWeight: FontWeight.w800,
                              color: AceColors.ink,
                              height: 1,
                            ),
                          ),
                          TextSpan(
                            text: '/$target',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: AceColors.slate,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (isComplete)
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle,
                              size: 12,
                              color: AceColors.teal,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Goal complete',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: AceColors.teal,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                        ),
                      )
                    else
                      Text(
                        label,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AceColors.slateLight,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.strokeWidth,
    required this.trackColor,
    required this.progressColor,
  });

  final double progress;
  final double strokeWidth;
  final Color trackColor;
  final Color progressColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = (math.min(size.width, size.height) - strokeWidth) / 2;

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    if (progress <= 0) return;

    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}
