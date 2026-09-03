import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'ace_colors.dart';

/// Typography tokens: Geist Sans for interface copy, Geist Mono for question
/// IDs, calculations, and dosages.
abstract final class AceTypography {
  static TextTheme textTheme(TextTheme base) {
    return GoogleFonts.geistTextTheme(
      base,
    ).apply(bodyColor: AceColors.ink, displayColor: AceColors.ink);
  }

  static TextStyle mono({
    double fontSize = 13,
    Color color = AceColors.ink,
    FontWeight fontWeight = FontWeight.w500,
  }) {
    return GoogleFonts.geistMono(
      fontSize: fontSize,
      color: color,
      fontWeight: fontWeight,
    );
  }
}
