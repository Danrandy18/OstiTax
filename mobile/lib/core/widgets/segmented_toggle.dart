import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Control de dos opciones con "thumb" deslizante, igual espíritu que el
/// `.segmented` de la web (mismo lenguaje visual entre clientes).
class SegmentedToggle extends StatelessWidget {
  const SegmentedToggle({
    super.key,
    required this.leftLabel,
    required this.rightLabel,
    required this.valueIsLeft,
    required this.onChanged,
    this.enabled = true,
  });

  final String leftLabel;
  final String rightLabel;
  final bool valueIsLeft;
  final ValueChanged<bool> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.55,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final halfWidth = (constraints.maxWidth - 8) / 2;
          return Container(
            height: 44,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Stack(
              children: [
                AnimatedAlign(
                  duration: AppMotion.base,
                  curve: AppMotion.easeOut,
                  alignment: valueIsLeft
                      ? Alignment.centerLeft
                      : Alignment.centerRight,
                  child: Container(
                    width: halfWidth,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x14000000),
                          blurRadius: 4,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: _segmentButton(
                        leftLabel,
                        valueIsLeft,
                        () => enabled ? onChanged(true) : null,
                      ),
                    ),
                    Expanded(
                      child: _segmentButton(
                        rightLabel,
                        !valueIsLeft,
                        () => enabled ? onChanged(false) : null,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _segmentButton(String label, bool active, VoidCallback? onTap) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(8),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14,
            color: active ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
