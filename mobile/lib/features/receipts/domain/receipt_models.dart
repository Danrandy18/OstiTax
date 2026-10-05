/// Mismos modelos que la web (web/src/app/core/receipts/receipt.models.ts). La categoria
/// fiscal y la regla GWG las decide el backend; aqui solo se muestran y se editan.
const receiptCategories = [
  'workEquipment',
  'training',
  'travel',
  'homeServices',
  'other',
];

const receiptVatRates = [20, 13, 10, 0];

class ReceiptField<T> {
  const ReceiptField(this.value, this.evidence);

  final T? value;

  /// Linea del recibo de la que se leyo el dato (se resalta en la revision).
  final String? evidence;

  static ReceiptField<T> fromJson<T>(Object? json, T? Function(Object?) read) {
    final map = json is Map<String, dynamic> ? json : const <String, dynamic>{};
    return ReceiptField(read(map['value']), map['evidence'] as String?);
  }
}

/// Respuesta de POST /api/receipts/parse.
class ParsedReceipt {
  const ParsedReceipt({
    required this.merchant,
    required this.date,
    required this.total,
    required this.vatRate,
    required this.vatAmount,
    required this.vatEvidence,
    required this.documentNumber,
    required this.category,
    required this.categoryEvidence,
    required this.gwgLimit,
    required this.warnings,
  });

  final ReceiptField<String> merchant;
  final ReceiptField<String> date;
  final ReceiptField<double> total;
  final int? vatRate;
  final double? vatAmount;
  final String? vatEvidence;
  final ReceiptField<String> documentNumber;
  final String category;
  final List<String> categoryEvidence;
  final double gwgLimit;
  final List<String> warnings;

  factory ParsedReceipt.fromJson(Map<String, dynamic> json) {
    final vat = json['vat'] as Map<String, dynamic>? ?? const {};
    return ParsedReceipt(
      merchant: ReceiptField.fromJson(json['merchant'], (v) => v as String?),
      date: ReceiptField.fromJson(json['date'], (v) => v as String?),
      total: ReceiptField.fromJson(
        json['total'],
        (v) => (v as num?)?.toDouble(),
      ),
      vatRate: (vat['rate'] as num?)?.toInt(),
      vatAmount: (vat['amount'] as num?)?.toDouble(),
      vatEvidence: vat['evidence'] as String?,
      documentNumber: ReceiptField.fromJson(
        json['documentNumber'],
        (v) => v as String?,
      ),
      category: json['category'] as String? ?? 'other',
      categoryEvidence: [
        for (final e in json['categoryEvidence'] as List? ?? const []) '$e',
      ],
      gwgLimit: (json['gwgLimit'] as num?)?.toDouble() ?? 1000,
      warnings: [for (final w in json['warnings'] as List? ?? const []) '$w'],
    );
  }
}

/// Datos que el usuario confirma en la pantalla de revision.
class ReceiptInput {
  const ReceiptInput({
    required this.merchant,
    required this.date,
    required this.total,
    required this.vatRate,
    required this.vatAmount,
    required this.documentNumber,
    required this.category,
  });

  final String merchant;

  /// AAAA-MM-DD.
  final String? date;
  final double? total;
  final int? vatRate;
  final double? vatAmount;
  final String documentNumber;
  final String category;

  Map<String, dynamic> toJson() => {
    'merchant': merchant,
    'date': date,
    'total': total,
    'vatRate': vatRate,
    'vatAmount': vatAmount,
    'documentNumber': documentNumber,
    'category': category,
  };
}

/// Recibo guardado en la cuenta (el mismo que ve la web).
class Receipt {
  const Receipt({
    required this.id,
    required this.merchant,
    required this.date,
    required this.total,
    required this.category,
    required this.depreciation,
    required this.createdAt,
  });

  final String id;
  final String merchant;
  final String? date;
  final double? total;
  final String category;
  final bool depreciation;
  final String createdAt;

  /// Ano al que se imputa: el de la fecha del recibo o, sin fecha, el de alta.
  String get year => (date ?? createdAt).substring(0, 4);

  factory Receipt.fromJson(Map<String, dynamic> json) => Receipt(
    id: json['id'] as String,
    merchant: json['merchant'] as String? ?? '',
    date: json['date'] as String?,
    // Postgres numeric llega como numero (el backend lo convierte), pero se acepta texto.
    total: json['total'] == null ? null : double.tryParse('${json['total']}'),
    category: json['category'] as String? ?? 'other',
    depreciation: json['depreciation'] as bool? ?? false,
    createdAt: json['createdAt'] as String? ?? '',
  );
}

/// Totales por ano, del mas reciente al mas antiguo, sumados en centimos.
List<(String, double)> totalsByYear(List<Receipt> receipts) {
  final cents = <String, int>{};
  for (final r in receipts) {
    final total = r.total;
    if (total == null) continue;
    cents.update(
      r.year,
      (c) => c + (total * 100).round(),
      ifAbsent: () => (total * 100).round(),
    );
  }
  final years = cents.keys.toList()..sort((a, b) => b.compareTo(a));
  return [for (final y in years) (y, cents[y]! / 100)];
}
