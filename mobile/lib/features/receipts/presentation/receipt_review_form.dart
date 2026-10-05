import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../domain/receipt_models.dart';

/// Pantalla de revision: el usuario comprueba y corrige lo que leyo el backend antes de
/// guardarlo. Bajo cada campo se muestra la linea del recibo de la que salio el valor.
class ReceiptReviewForm extends ConsumerStatefulWidget {
  const ReceiptReviewForm({
    super.key,
    required this.parsed,
    required this.onSave,
    required this.onDiscard,
    this.image,
  });

  final ParsedReceipt parsed;
  final ImageProvider? image;
  final Future<void> Function(ReceiptInput input) onSave;
  final VoidCallback onDiscard;

  @override
  ConsumerState<ReceiptReviewForm> createState() => _ReceiptReviewFormState();
}

class _ReceiptReviewFormState extends ConsumerState<ReceiptReviewForm> {
  late final TextEditingController _merchant;
  late final TextEditingController _total;
  late final TextEditingController _vatAmount;
  late final TextEditingController _documentNumber;
  String? _date;
  int? _vatRate;
  late String _category;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.parsed;
    _merchant = TextEditingController(text: p.merchant.value ?? '');
    _total = TextEditingController(text: _formatAmount(p.total.value));
    _vatAmount = TextEditingController(text: _formatAmount(p.vatAmount));
    _documentNumber = TextEditingController(text: p.documentNumber.value ?? '');
    _date = p.date.value;
    _vatRate = receiptVatRates.contains(p.vatRate) ? p.vatRate : null;
    _category = receiptCategories.contains(p.category) ? p.category : 'other';
    _total.addListener(_refresh);
  }

  @override
  void dispose() {
    _merchant.dispose();
    _total.dispose();
    _vatAmount.dispose();
    _documentNumber.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  /// Aviso en pantalla: un bien de trabajo por encima del limite GWG se amortiza.
  bool get _gwgApplies =>
      _category == 'workEquipment' &&
      (parseAmount(_total.text) ?? 0) > widget.parsed.gwgLimit;

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_date ?? '') ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(DateTime.now().year + 1, 12, 31),
    );
    if (picked == null) return;
    setState(() {
      _date =
          '${picked.year.toString().padLeft(4, '0')}-'
          '${picked.month.toString().padLeft(2, '0')}-'
          '${picked.day.toString().padLeft(2, '0')}';
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await widget.onSave(
      ReceiptInput(
        merchant: _merchant.text.trim(),
        date: _date,
        total: parseAmount(_total.text),
        vatRate: _vatRate,
        vatAmount: parseAmount(_vatAmount.text),
        documentNumber: _documentNumber.text.trim(),
        category: _category,
      ),
    );
    if (mounted) setState(() => _saving = false);
  }

  void _zoom() {
    final image = widget.image;
    if (image == null) return;
    showDialog<void>(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(12),
        child: InteractiveViewer(maxScale: 5, child: Image(image: image)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.parsed;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          ref.tr('receiptsReviewTitle'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 4),
        Text(
          ref.tr('receiptsReviewHint'),
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        if (widget.image != null) ...[
          const SizedBox(height: 12),
          GestureDetector(
            onTap: _zoom,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image(
                image: widget.image!,
                height: 160,
                fit: BoxFit.cover,
              ),
            ),
          ),
        ],
        for (final w in p.warnings) _Warning(ref.tr('receiptsWarn_$w')),
        const SizedBox(height: 8),
        TextField(
          key: const Key('receiptMerchant'),
          controller: _merchant,
          decoration: InputDecoration(labelText: ref.tr('receiptsMerchant')),
        ),
        _Evidence(p.merchant.evidence),
        InkWell(
          onTap: _pickDate,
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: ref.tr('receiptsDate'),
              suffixIcon: const Icon(Icons.calendar_today_rounded, size: 18),
            ),
            child: Text(_displayDate(_date)),
          ),
        ),
        _Evidence(p.date.evidence),
        TextField(
          key: const Key('receiptTotal'),
          controller: _total,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(labelText: ref.tr('receiptsTotal')),
        ),
        _Evidence(p.total.evidence),
        DropdownButtonFormField<int?>(
          initialValue: _vatRate,
          decoration: InputDecoration(labelText: ref.tr('receiptsVat')),
          items: [
            DropdownMenuItem(child: Text(ref.tr('receiptsVatNone'))),
            for (final r in receiptVatRates)
              DropdownMenuItem(value: r, child: Text('$r %')),
          ],
          onChanged: (value) => setState(() => _vatRate = value),
        ),
        _Evidence(p.vatEvidence),
        TextField(
          controller: _vatAmount,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(labelText: ref.tr('receiptsVatAmount')),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _documentNumber,
          decoration: InputDecoration(
            labelText: ref.tr('receiptsDocumentNumber'),
          ),
        ),
        _Evidence(p.documentNumber.evidence),
        DropdownButtonFormField<String>(
          key: const Key('receiptCategory'),
          initialValue: _category,
          isExpanded: true,
          decoration: InputDecoration(labelText: ref.tr('receiptsCategory')),
          items: [
            for (final c in receiptCategories)
              DropdownMenuItem(value: c, child: Text(ref.tr('receiptsCat_$c'))),
          ],
          onChanged: (value) => setState(() => _category = value ?? _category),
        ),
        _Evidence(
          p.categoryEvidence.isEmpty ? null : p.categoryEvidence.join(', '),
        ),
        if (_gwgApplies) _Warning(ref.tr('receiptsGwgWarning')),
        const SizedBox(height: 8),
        Text(
          ref.tr('receiptsDisclaimer'),
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 14),
        ElevatedButton(
          key: const Key('receiptSave'),
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(ref.tr('receiptsSave')),
        ),
        const SizedBox(height: 6),
        OutlinedButton(
          onPressed: _saving ? null : widget.onDiscard,
          child: Text(ref.tr('receiptsDiscard')),
        ),
      ],
    );
  }
}

/// Acepta "1.234,56", "1234,56" y "1234.56"; vacio o invalido -> null.
double? parseAmount(String raw) {
  var text = raw.trim().replaceAll(RegExp(r'[€\s]'), '');
  if (text.isEmpty) return null;
  if (text.contains(',')) {
    text = text.replaceAll('.', '').replaceAll(',', '.');
  }
  final value = double.tryParse(text);
  if (value == null || value < 0) return null;
  return (value * 100).round() / 100;
}

String _formatAmount(double? value) =>
    value == null ? '' : value.toStringAsFixed(2).replaceAll('.', ',');

String _displayDate(String? iso) {
  if (iso == null || iso.length < 10) return '—';
  return '${iso.substring(8, 10)}.${iso.substring(5, 7)}.${iso.substring(0, 4)}';
}

class _Evidence extends ConsumerWidget {
  const _Evidence(this.evidence);

  final String? evidence;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = evidence;
    if (text == null || text.isEmpty) return const SizedBox(height: 8);
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 8),
      child: Text.rich(
        TextSpan(
          text: '${ref.tr('receiptsReadFrom')}: ',
          children: [
            TextSpan(
              text: text,
              style: const TextStyle(
                backgroundColor: AppColors.warningTint,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
      ),
    );
  }
}

class _Warning extends StatelessWidget {
  const _Warning(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.warningTint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(color: AppColors.warning, fontSize: 13),
      ),
    );
  }
}
