import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/tr.dart';
import '../theme/app_theme.dart';

/// Pie de pagina legal. Sigue el idioma de la UI (la UI va 100% traducida); solo el PDF
/// exportado sale siempre en aleman oficial (ver CLAUDE.md).
class LegalDisclaimerFooter extends ConsumerWidget {
  const LegalDisclaimerFooter({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 13)),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 11,
                  height: 1.4,
                  color: AppColors.textSecondary,
                ),
                children: [
                  TextSpan(
                    text: '${ref.tr('disclaimerTitle')}: ',
                    style: const TextStyle(
                      color: AppColors.warning,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextSpan(text: ref.tr('disclaimerText')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
