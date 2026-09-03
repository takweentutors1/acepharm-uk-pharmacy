import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/utils/password_entropy.dart';

/// Live strength indicator shown beneath the password field on sign-up.
/// Recomputes on every keystroke via [password]; pairs colour with a text
/// label so strength is never conveyed by colour alone.
class PasswordStrengthMeter extends StatelessWidget {
  const PasswordStrengthMeter({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();

    final strength = PasswordEntropy.strengthFor(password);
    final (label, color, segments) = switch (strength) {
      PasswordStrength.weak => ('Weak', AceColors.dangerRose, 1),
      PasswordStrength.fair => ('Fair', AceColors.slate, 2),
      PasswordStrength.strong => ('Strong', AceColors.teal, 3),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(3, (i) {
            final filled = i < segments;
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i == 2 ? 0 : 4),
                height: 4,
                decoration: BoxDecoration(
                  color: filled ? color : AceColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Text(
          'Password strength: $label',
          style: TextStyle(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
