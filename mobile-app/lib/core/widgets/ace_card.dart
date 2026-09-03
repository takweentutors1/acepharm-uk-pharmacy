import 'package:flutter/material.dart';

import '../theme/ace_colors.dart';
import '../theme/ace_spacing.dart';

/// Base container for grouped content: question panels, dashboard tiles,
/// settings rows. Wraps [Card] with the app's standard padding, an
/// optional tap target, and a neutral selection border.
///
/// [selected] only ever renders the neutral indigo outline — never a
/// correctness colour — per the "zero pre-submission colour" invariant.
class AceCard extends StatelessWidget {
  const AceCard({
    super.key,
    required this.child,
    this.onTap,
    this.selected = false,
    this.padding = const EdgeInsets.all(AceSpacing.lg),
  });

  final Widget child;
  final VoidCallback? onTap;
  final bool selected;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: AceColors.surface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: selected ? AceColors.aceIndigo : AceColors.border,
          width: selected ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}
