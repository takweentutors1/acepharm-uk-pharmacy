import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// A full-screen SVG background widget that maintains aspect ratio
/// and covers the entire screen. Used for decorative section backgrounds.
class AceBackground extends StatelessWidget {
  const AceBackground({
    super.key,
    required this.assetPath,
    this.opacity = 1.0,
    this.child,
  });

  final String assetPath;
  final double opacity;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: Opacity(
            opacity: opacity,
            child: SvgPicture.asset(
              assetPath,
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
            ),
          ),
        ),
        if (child != null) child!,
      ],
    );
  }
}
