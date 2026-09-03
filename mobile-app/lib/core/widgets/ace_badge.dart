import 'package:flutter/material.dart';

import '../theme/ace_colors.dart';
import '../theme/ace_spacing.dart';

enum AceBadgeVariant { neutral, info, success, danger }

/// Pill badge. Always pairs an icon with its text label so status is never
/// conveyed by colour alone (product invariant #3: multi-cue feedback).
class AceBadge extends StatelessWidget {
  const AceBadge({
    super.key,
    required this.label,
    this.variant = AceBadgeVariant.neutral,
    this.icon,
  });

  final String label;
  final AceBadgeVariant variant;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (
      Color background,
      Color foreground,
      IconData defaultIcon,
    ) = switch (variant) {
      AceBadgeVariant.neutral => (
        AceColors.slate.withValues(alpha: 0.08),
        AceColors.slate,
        Icons.circle_outlined,
      ),
      AceBadgeVariant.info => (
        AceColors.indigoWash,
        AceColors.deepIndigo,
        Icons.info_outline,
      ),
      AceBadgeVariant.success => (
        AceColors.tealLight,
        AceColors.teal,
        Icons.check_circle_outline,
      ),
      AceBadgeVariant.danger => (
        AceColors.dangerRose.withValues(alpha: 0.08),
        AceColors.dangerRose,
        Icons.cancel_outlined,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AceSpacing.md,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon ?? defaultIcon, size: 14, color: foreground),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
