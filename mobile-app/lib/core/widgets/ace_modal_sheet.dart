import 'package:flutter/material.dart';

import '../theme/ace_colors.dart';
import '../theme/ace_spacing.dart';

/// Consistent bottom-sheet chrome for the app's modal flows (Ask Ace chat,
/// confirmation dialogs, filter pickers): rounded top corners, a drag
/// handle, an optional title, and safe-area padding.
abstract final class AceModalSheet {
  static Future<T?> show<T>({
    required BuildContext context,
    required WidgetBuilder builder,
    String? title,
    bool isScrollControlled = true,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      backgroundColor: AceColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AceSpacing.lg,
              AceSpacing.sm,
              AceSpacing.lg,
              AceSpacing.lg,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: AceSpacing.lg),
                    decoration: BoxDecoration(
                      color: AceColors.border,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                if (title != null) ...[
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AceColors.ink,
                    ),
                  ),
                  const SizedBox(height: AceSpacing.md),
                ],
                builder(sheetContext),
              ],
            ),
          ),
        );
      },
    );
  }
}
