import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_controller.dart';
import 'payment_sheet.dart';

/// Comparativa Gratis vs Pro. Se abre desde el botón "Pro" del encabezado.
/// [context] debe seguir montado al cerrar la hoja: desde él se abre el pago o el login.
Future<void> showUpgradeSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => UpgradeSheet(parentContext: context),
  );
}

enum _CellKind { text, yes, no, soon }

class _Cell {
  const _Cell.text(this.key) : kind = _CellKind.text;
  const _Cell.yes() : kind = _CellKind.yes, key = null;
  const _Cell.no() : kind = _CellKind.no, key = null;
  const _Cell.soon() : kind = _CellKind.soon, key = null;

  final _CellKind kind;
  final String? key;
}

class _CompareRow {
  const _CompareRow(this.labelKey, this.free, this.pro);

  final String labelKey;
  final _Cell free;
  final _Cell pro;
}

/// Solo se listan como disponibles funciones que existen de verdad.
const _rows = [
  _CompareRow(
    'compareRowCalcs',
    _Cell.text('compareCalcsFree'),
    _Cell.text('compareCalcsPro'),
  ),
  _CompareRow('compareRowPdf', _Cell.no(), _Cell.yes()),
  _CompareRow('compareRowAccount', _Cell.no(), _Cell.yes()),
  _CompareRow('compareRowOcr', _Cell.no(), _Cell.soon()),
];

class UpgradeSheet extends ConsumerWidget {
  const UpgradeSheet({super.key, required this.parentContext});

  final BuildContext parentContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(authControllerProvider).account != null;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                ref.tr('compareTitle'),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                ref.tr('compareSubtitle'),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              _HeaderRow(
                feature: ref.tr('compareFeatureCol'),
                free: ref.tr('compareFreeCol'),
                pro: ref.tr('compareProCol'),
              ),
              for (var i = 0; i < _rows.length; i++)
                _RowView(row: _rows[i], isLast: i == _rows.length - 1),
              const SizedBox(height: 16),
              Text(
                ref.tr('comparePriceLine'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              FilledButton(
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.of(context).pop();
                  showPaymentSheet(parentContext);
                },
                child: Text(
                  ref.tr('compareChoosePlan'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ),
              if (!loggedIn)
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    GoRouter.of(parentContext).push('/login');
                  },
                  child: Text(ref.tr('compareHaveAccount')),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

const _featureFlex = 46;
const _valueFlex = 27;

class _HeaderRow extends StatelessWidget {
  const _HeaderRow({
    required this.feature,
    required this.free,
    required this.pro,
  });

  final String feature;
  final String free;
  final String pro;

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.4,
      color: AppColors.textSecondary,
    );
    return Row(
      children: [
        Expanded(
          flex: _featureFlex,
          child: Text(feature.toUpperCase(), style: style),
        ),
        Expanded(
          flex: _valueFlex,
          child: Text(
            free.toUpperCase(),
            textAlign: TextAlign.center,
            style: style,
          ),
        ),
        Expanded(
          flex: _valueFlex,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.07),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(8),
              ),
            ),
            child: Text(
              pro.toUpperCase(),
              textAlign: TextAlign.center,
              style: style,
            ),
          ),
        ),
      ],
    );
  }
}

class _RowView extends ConsumerWidget {
  const _RowView({required this.row, required this.isLast});

  final _CompareRow row;
  final bool isLast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DecoratedBox(
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: _featureFlex,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    ref.tr(row.labelKey),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              flex: _valueFlex,
              child: Center(child: _CellView(cell: row.free, isPro: false)),
            ),
            Expanded(
              flex: _valueFlex,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.07),
                  borderRadius: isLast
                      ? const BorderRadius.vertical(bottom: Radius.circular(8))
                      : null,
                ),
                alignment: Alignment.center,
                child: _CellView(cell: row.pro, isPro: true),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CellView extends ConsumerWidget {
  const _CellView({required this.cell, required this.isPro});

  final _Cell cell;
  final bool isPro;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (cell.kind) {
      case _CellKind.text:
        return Text(
          ref.tr(cell.key!),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isPro ? FontWeight.w800 : FontWeight.w500,
            color: isPro ? AppColors.primary : AppColors.textPrimary,
          ),
        );
      case _CellKind.yes:
        return const Icon(
          Icons.check_rounded,
          size: 20,
          color: AppColors.success,
          semanticLabel: 'Pro',
        );
      case _CellKind.no:
        return const Text(
          '—',
          style: TextStyle(color: AppColors.textSecondary),
        );
      case _CellKind.soon:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.warningTint,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            ref.tr('compareComingSoon'),
            style: const TextStyle(
              color: AppColors.warning,
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        );
    }
  }
}
