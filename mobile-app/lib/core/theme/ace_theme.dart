import 'package:flutter/material.dart';

import 'ace_colors.dart';
import 'ace_spacing.dart';
import 'ace_typography.dart';

/// Composes [AceColors], [AceTypography], and [AceSpacing] into the app's
/// single light [ThemeData]. The design system defines no dark tokens, so
/// the app ships light-only.
abstract final class AceTheme {
  static ThemeData get light {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);

    final colorScheme = base.colorScheme.copyWith(
      primary: AceColors.aceIndigo,
      onPrimary: AceColors.surface,
      primaryContainer: AceColors.indigoWash,
      onPrimaryContainer: AceColors.deepIndigo,
      secondary: AceColors.teal,
      onSecondary: AceColors.surface,
      secondaryContainer: AceColors.tealLight,
      onSecondaryContainer: AceColors.teal,
      error: AceColors.dangerRose,
      onError: AceColors.surface,
      surface: AceColors.surface,
      onSurface: AceColors.ink,
      outline: AceColors.border,
    );

    return base.copyWith(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AceColors.canvas,
      textTheme: AceTypography.textTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: AceColors.surface,
        foregroundColor: AceColors.ink,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: AceColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AceColors.border),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AceColors.border,
        thickness: 1,
        space: 1,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AceColors.aceIndigo,
          foregroundColor: AceColors.surface,
          disabledBackgroundColor: AceColors.slateLight,
          minimumSize: const Size.fromHeight(AceSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(horizontal: AceSpacing.xl),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AceColors.aceIndigo,
          side: const BorderSide(color: AceColors.border),
          minimumSize: const Size.fromHeight(AceSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(horizontal: AceSpacing.xl),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AceColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AceSpacing.lg,
          vertical: AceSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AceColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AceColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AceColors.aceIndigo, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AceColors.dangerRose),
        ),
      ),
    );
  }
}
