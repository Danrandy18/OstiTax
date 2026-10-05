import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/config/feature_flags.dart';
import '../../../core/l10n/tr.dart';
import '../../../core/network/api_client.dart' show ApiException;
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/legal_disclaimer_footer.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../calculator/data/pdf_export.dart';
import '../../payment/presentation/upgrade_sheet.dart';
import '../data/receipt_scanner.dart';
import '../domain/receipt_models.dart';
import 'receipt_review_form.dart';
import 'receipts_controller.dart';

enum _Step { idle, reading, analyzing, review }

/// Escaner de recibos (Pro): foto -> texto en el movil (ML Kit) -> el backend extrae los datos
/// -> el usuario los revisa -> se guardan en la cuenta (los mismos que ve la web).
class ReceiptsScreen extends ConsumerStatefulWidget {
  const ReceiptsScreen({super.key});

  @override
  ConsumerState<ReceiptsScreen> createState() => _ReceiptsScreenState();
}

class _ReceiptsScreenState extends ConsumerState<ReceiptsScreen> {
  _Step _step = _Step.idle;
  String? _imagePath;
  ParsedReceipt? _parsed;
  bool _busy = false;

  /// Ano del export; null = todos.
  int? _exportYear;
  bool _exportYearTouched = false;

  String? get _token => ref.read(authControllerProvider).token;

  void _showError(String key) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(ref.tr(key))));
  }

  Future<void> _scan({required bool fromCamera}) async {
    final token = _token;
    if (token == null) return;

    final String? path;
    try {
      path = await ref.read(receiptImagePickerProvider)(fromCamera: fromCamera);
    } catch (_) {
      _showError('receiptsErrorOcr');
      return;
    }
    if (path == null || !mounted) return;

    setState(() {
      _imagePath = path;
      _step = _Step.reading;
    });

    final String text;
    try {
      text = await ref.read(receiptTextReaderProvider)(path);
    } catch (_) {
      _fail('receiptsErrorOcr');
      return;
    }
    if (text.trim().length < 3) {
      _fail('receiptsErrorOcr');
      return;
    }

    if (!mounted) return;
    setState(() => _step = _Step.analyzing);
    try {
      final parsed = await ref
          .read(receiptsRepositoryProvider)
          .parse(text, token);
      if (!mounted) return;
      setState(() {
        _parsed = parsed;
        _step = _Step.review;
      });
    } on ApiException catch (error) {
      // 403 PRO_REQUIRED: el abono termino mientras la pantalla estaba abierta.
      if (error.code == 'PRO_REQUIRED') {
        await ref.read(authControllerProvider.notifier).refreshAccount();
      }
      _fail('receiptsErrorParse');
    } catch (_) {
      _fail('receiptsErrorParse');
    }
  }

  void _fail(String key) {
    if (!mounted) return;
    setState(_reset);
    _showError(key);
  }

  void _reset() {
    _step = _Step.idle;
    _parsed = null;
    _imagePath = null;
  }

  Future<void> _save(ReceiptInput input) async {
    try {
      await ref.read(receiptsControllerProvider.notifier).add(input);
      if (!mounted) return;
      setState(_reset);
    } catch (_) {
      _showError('receiptsErrorSave');
    }
  }

  Future<void> _run(Future<void> Function() action, String errorKey) async {
    setState(() => _busy = true);
    try {
      await action();
    } catch (_) {
      _showError(errorKey);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _confirm(String messageKey, {required String confirmKey}) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(ref.tr(messageKey)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(ref.tr('receiptsCancel')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(ref.tr(confirmKey)),
          ),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _remove(Receipt receipt) async {
    if (!await _confirm(
      'receiptsRemoveConfirm',
      confirmKey: 'receiptsRemove',
    )) {
      return;
    }
    await _run(
      () => ref.read(receiptsControllerProvider.notifier).remove(receipt.id),
      'receiptsErrorAction',
    );
  }

  Future<void> _removeAll() async {
    if (!await _confirm(
      'receiptsRemoveAllConfirm',
      confirmKey: 'receiptsRemoveAll',
    )) {
      return;
    }
    await _run(
      () => ref.read(receiptsControllerProvider.notifier).removeAll(),
      'receiptsErrorAction',
    );
  }

  Future<void> _exportPdf() async {
    final token = _token;
    if (token == null) return;
    await _run(() async {
      final bytes = await ref
          .read(receiptsRepositoryProvider)
          .exportPdf(_exportYear, token);
      final name =
          'OestiTax-Belege${_exportYear == null ? '' : '-$_exportYear'}.pdf';
      await ref.read(pdfSharerProvider)(bytes, name);
    }, 'receiptsErrorExport');
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(authControllerProvider).account;
    final state = ref.watch(receiptsControllerProvider);
    final isPro = account?.isPro ?? false;

    final years = [
      for (final (year, _) in totalsByYear(state.receipts)) int.parse(year),
    ];
    if (!_exportYearTouched ||
        (_exportYear != null && !years.contains(_exportYear))) {
      _exportYear = years.isEmpty ? null : years.first;
    }

    return Scaffold(
      appBar: AppBar(title: Text(ref.tr('receiptsTitle'))),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              ref.tr('receiptsSubtitle'),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            if (!isPro)
              _ProCard(hasReceipts: state.receipts.isNotEmpty)
            else ...[
              _Hint(ref.tr('receiptsPrivacy')),
              const SizedBox(height: 16),
              _buildScanner(),
            ],
            const SizedBox(height: 20),
            _buildSaved(state),
            if (state.receipts.isNotEmpty) ...[
              const SizedBox(height: 20),
              _buildExport(years),
            ],
          ],
        ),
      ),
      bottomNavigationBar: const LegalDisclaimerFooter(),
    );
  }

  Widget _buildScanner() {
    switch (_step) {
      case _Step.idle:
        return _Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ElevatedButton.icon(
                key: const Key('receiptsCamera'),
                onPressed: () => _scan(fromCamera: true),
                icon: const Icon(Icons.photo_camera_rounded),
                label: Text(ref.tr('receiptsCamera')),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                key: const Key('receiptsChooseFile'),
                onPressed: () => _scan(fromCamera: false),
                icon: const Icon(Icons.photo_library_rounded),
                label: Text(ref.tr('receiptsChooseFile')),
              ),
            ],
          ),
        );
      case _Step.reading:
      case _Step.analyzing:
        return _Card(
          child: Row(
            children: [
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  ref.tr(
                    _step == _Step.reading
                        ? 'receiptsReading'
                        : 'receiptsAnalyzing',
                  ),
                ),
              ),
            ],
          ),
        );
      case _Step.review:
        return _Card(
          child: ReceiptReviewForm(
            parsed: _parsed!,
            image: _imagePath == null ? null : FileImage(File(_imagePath!)),
            onSave: _save,
            onDiscard: () => setState(_reset),
          ),
        );
    }
  }

  Widget _buildSaved(ReceiptsState state) {
    // Mismo formato que el resto de la app ("3.000,00 €"), sea cual sea el idioma.
    final money = NumberFormat.currency(
      locale: 'de_DE',
      symbol: '€',
      decimalDigits: 2,
    );
    final totals = totalsByYear(state.receipts);

    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            ref.tr('receiptsSavedTitle'),
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 8),
          if (state.loading && !state.loaded)
            Text(
              ref.tr('receiptsLoading'),
              style: const TextStyle(color: AppColors.textSecondary),
            )
          else if (state.loadFailed && !state.loaded) ...[
            Text(
              ref.tr('receiptsErrorLoad'),
              style: const TextStyle(color: AppColors.error),
            ),
            TextButton(
              onPressed: () =>
                  ref.read(receiptsControllerProvider.notifier).load(),
              child: Text(ref.tr('receiptsRetry')),
            ),
          ] else if (state.receipts.isEmpty)
            Text(
              ref.tr('receiptsEmpty'),
              style: const TextStyle(color: AppColors.textSecondary),
            )
          else ...[
            Text(
              ref.tr('receiptsSyncedHint'),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
            for (final r in state.receipts)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  r.merchant.isEmpty ? '—' : r.merchant,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  '${_formatDate(r.date)} · ${ref.tr('receiptsCat_${r.category}')}',
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      money.format(r.total ?? 0),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                    IconButton(
                      tooltip: ref.tr('receiptsRemove'),
                      onPressed: _busy ? null : () => _remove(r),
                      icon: const Icon(Icons.delete_outline_rounded),
                    ),
                  ],
                ),
              ),
            const Divider(),
            for (final (year, total) in totals)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  '$year — ${ref.tr('receiptsYearTotal')}: ${money.format(total)}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildExport(List<int> years) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            ref.tr('receiptsExportTitle'),
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<int?>(
            initialValue: _exportYear,
            decoration: InputDecoration(
              labelText: ref.tr('receiptsExportYear'),
            ),
            items: [
              for (final y in years)
                DropdownMenuItem(value: y, child: Text('$y')),
              DropdownMenuItem(child: Text(ref.tr('receiptsAllYears'))),
            ],
            onChanged: (value) => setState(() {
              _exportYear = value;
              _exportYearTouched = true;
            }),
          ),
          const SizedBox(height: 8),
          Text(
            ref.tr('receiptsExportHint'),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            key: const Key('receiptsExportPdf'),
            onPressed: _busy ? null : _exportPdf,
            icon: const Icon(Icons.picture_as_pdf_rounded),
            label: Text(ref.tr('receiptsExportPdf')),
          ),
          const SizedBox(height: 4),
          TextButton(
            onPressed: _busy ? null : _removeAll,
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(ref.tr('receiptsRemoveAll')),
          ),
        ],
      ),
    );
  }
}

/// AAAA-MM-DD -> TT.MM.JJJJ (formato austriaco, igual que el PDF).
String _formatDate(String? iso) {
  if (iso == null || iso.length < 10) return '—';
  return '${iso.substring(8, 10)}.${iso.substring(5, 7)}.${iso.substring(0, 4)}';
}

class _ProCard extends ConsumerWidget {
  const _ProCard({required this.hasReceipts});

  final bool hasReceipts;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            ref.tr('receiptsProRequired'),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          if (hasReceipts) ...[
            const SizedBox(height: 6),
            Text(
              ref.tr('receiptsProExpired'),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
          // En la build de Play no se vende nada dentro de la app (ver feature_flags.dart).
          if (purchasesEnabled) ...[
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => showUpgradeSheet(context),
              child: Text(ref.tr('receiptsUpgrade')),
            ),
          ],
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.lock_outline_rounded,
          size: 18,
          color: AppColors.success,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
