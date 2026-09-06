import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Pie de pagina legal, siempre en aleman oficial independientemente del
/// idioma de la UI (mismo criterio que el PDF exportado, ver CLAUDE.md).
class LegalDisclaimerFooter extends StatelessWidget {
  const LegalDisclaimerFooter({super.key});

  @override
  Widget build(BuildContext context) {
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
              text: const TextSpan(
                style: TextStyle(
                  fontSize: 11,
                  height: 1.4,
                  color: AppColors.textSecondary,
                ),
                children: [
                  TextSpan(
                    text: 'Haftungsausschluss: ',
                    style: TextStyle(
                      color: AppColors.warning,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextSpan(
                    text: 'Keine Steuerberatung. Informativer Schätzwert.',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
