import 'package:flutter/material.dart';

import '../theme/ace_colors.dart';
import '../theme/ace_spacing.dart';

enum AceButtonVariant { primary, secondary, destructive, ghost }

/// Standard action button. Wraps the app's centrally themed button styles
/// with a loading state, an optional leading icon, and a destructive
/// variant not covered by [AceTheme]'s default button themes.
class AceButton extends StatelessWidget {
  const AceButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AceButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final AceButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final disabled = isLoading || onPressed == null;
    final child = isLoading
        ? const SizedBox(
            height: 18,
            width: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              color: AceColors.surface,
            ),
          )
        : _ButtonContent(label: label, icon: icon);

    final button = switch (variant) {
      AceButtonVariant.primary => ElevatedButton(
        onPressed: disabled ? null : onPressed,
        child: child,
      ),
      AceButtonVariant.destructive => ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AceColors.dangerRose,
          foregroundColor: AceColors.surface,
          minimumSize: const Size.fromHeight(AceSpacing.minTouchTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onPressed: disabled ? null : onPressed,
        child: child,
      ),
      AceButtonVariant.secondary => OutlinedButton(
        onPressed: disabled ? null : onPressed,
        child: child,
      ),
      AceButtonVariant.ghost => TextButton(
        style: TextButton.styleFrom(
          foregroundColor: AceColors.aceIndigo,
          minimumSize: const Size.fromHeight(AceSpacing.minTouchTarget),
        ),
        onPressed: disabled ? null : onPressed,
        child: child,
      ),
    };

    if (!fullWidth) return button;
    return SizedBox(width: double.infinity, child: button);
  }
}

class _ButtonContent extends StatelessWidget {
  const _ButtonContent({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    if (icon == null) return Text(label);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: AceSpacing.sm),
        Text(label),
      ],
    );
  }
}
