import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../confidence.dart';

/// Pre-submission confidence rating (product invariant #2: must be
/// captured before submit). Selection is a neutral indigo highlight only
/// — confidence has no correct/incorrect meaning of its own, so no
/// correctness colour is ever relevant here.
class ConfidenceSelector extends StatelessWidget {
  const ConfidenceSelector({super.key, required this.value, this.onChanged});

  final Confidence? value;
  final ValueChanged<Confidence>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: Confidence.values
          .map(
            (confidence) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: confidence == Confidence.values.last
                      ? 0
                      : AceSpacing.sm,
                ),
                child: _ConfidenceChip(
                  confidence: confidence,
                  selected: value == confidence,
                  onTap: onChanged == null
                      ? null
                      : () => onChanged!(confidence),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ConfidenceChip extends StatelessWidget {
  const _ConfidenceChip({
    required this.confidence,
    required this.selected,
    required this.onTap,
  });

  final Confidence confidence;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(vertical: AceSpacing.md),
        decoration: BoxDecoration(
          color: selected ? AceColors.indigoWash : AceColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AceColors.aceIndigo : AceColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          confidence.label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: selected ? AceColors.deepIndigo : AceColors.slate,
          ),
        ),
      ),
    );
  }
}
