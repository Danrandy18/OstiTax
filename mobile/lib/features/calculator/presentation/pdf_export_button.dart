import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/feature_flags.dart';
import '../../../core/l10n/tr.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../payment/presentation/payment_sheet.dart';
import '../../session/presentation/session_controller.dart';
import '../data/calculation_pdf.dart';
import '../data/pdf_export.dart';
import 'calculator_controller.dart';

/// Botón "Exportar PDF" de la tarjeta de resultados. Es una función Pro, igual que en la web:
/// quien no lo es ve un aviso (sin enlace de pago cuando la app no vende suscripciones).
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
    if (!_isPro) {
      if (purchasesEnabled) {
        await showPaymentSheet(context);
      } else {
        await showPdfProDialog(context);
      }
      return;
    }

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
    // watch: el botón cambia (candado o PDF) cuando la cuenta pasa a Pro.
    final auth = ref.watch(authControllerProvider);
    final session = ref.watch(sessionControllerProvider);
    final isPro =
        (auth.account?.isPro ?? false) || (session.status?.isPro ?? false);

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
            : Icon(
                isPro
                    ? Icons.picture_as_pdf_rounded
                    : Icons.lock_outline_rounded,
                size: 18,
              ),
        label: Text(ref.tr('exportPdf')),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}

/// Aviso de que exportar el PDF es de Pro. No lleva a ningún pago: solo informa y deja
/// entrar a quien ya es Pro por una compra hecha en la web.
Future<void> showPdfProDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    builder: (dialogContext) => _PdfProDialog(parentContext: context),
  );
}

class _PdfProDialog extends ConsumerWidget {
  const _PdfProDialog({required this.parentContext});

  final BuildContext parentContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(authControllerProvider).account != null;

    return AlertDialog(
      title: Text(ref.tr('exportPdf')),
      content: Text(
        loggedIn
            ? ref.tr('exportPdfProHint')
            : '${ref.tr('exportPdfProHint')}\n\n${ref.tr('proLoginHint')}',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(ref.tr('close')),
        ),
        if (!loggedIn)
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              GoRouter.of(parentContext).push('/login');
            },
            child: Text(ref.tr('authLoginButton')),
          ),
      ],
    );
  }
}
