import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/tr.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../session/presentation/session_controller.dart';
import '../data/calculation_pdf.dart';
import '../data/pdf_export.dart';
import 'calculator_controller.dart';

/// Botón "Exportar PDF" de la tarjeta de resultados. Igual que en la web: quien no es Pro
/// descarga el PDF básico (con aviso de mejora) y quien es Pro, el informe completo.
class PdfExportButton extends ConsumerStatefulWidget {
  const PdfExportButton({super.key});

  @override
  ConsumerState<PdfExportButton> createState() => _PdfExportButtonState();
}

class _PdfExportButtonState extends ConsumerState<PdfExportButton> {
  bool _exporting = false;

  bool get _isPro {
    final auth = ref.read(authControllerProvider);
    final session = ref.read(sessionControllerProvider);
    return (auth.account?.isPro ?? false) || (session.status?.isPro ?? false);
  }

  Future<void> _onPressed() async {
    final state = ref.read(calculatorControllerProvider);
    final result = state.result;
    if (result == null || _exporting) return;

    setState(() => _exporting = true);
    try {
      final now = DateTime.now();
      final bytes = await buildCalculationPdf(
        request: state.form,
        response: result,
        now: now,
        // Gratis: PDF básico con aviso de Pro. Pro: informe completo.
        tier: _isPro ? PdfTier.pro : PdfTier.basic,
      );
      await ref.read(pdfSharerProvider)(bytes, officialPdfFileName(now));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(ref.tr('errorGeneric'))));
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _exporting ? null : _onPressed,
        icon: _exporting
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.picture_as_pdf_rounded, size: 18),
        label: Text(ref.tr('exportPdf')),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}
