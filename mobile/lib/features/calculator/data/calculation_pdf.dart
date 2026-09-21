import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../domain/calculation_models.dart';
import 'pdf_extra_de.dart';
import 'pdf_official_de.dart';

const _brand = PdfColor.fromInt(0xFF0D5C56);
const _text = PdfColor.fromInt(0xFF211D17);
const _muted = PdfColor.fromInt(0xFF726B5E);
const _border = PdfColor.fromInt(0xFFE6E1D7);
const _success = PdfColor.fromInt(0xFF1F7A4D);
const _successTint = PdfColor.fromInt(0xFFE7F2EA);
const _brandTint = PdfColor.fromInt(0xFFE8F1EF);
const _white = PdfColors.white;

const _marginX = 40.0;
const _labelWidth = 235.0;

/// Formato de importe del PDF oficial: "€ 3.000,00", igual que el Intl.NumberFormat('de-AT') de
/// la web. No se usa el locale de_AT de Dart porque agrupa los miles con espacio ("3 000,00").
final _euroFormat = NumberFormat.currency(
  locale: 'de_DE',
  symbol: '€',
  customPattern: '¤${String.fromCharCode(0xA0)}#,##0.00',
);

String formatOfficialEuro(double amount) => _euroFormat.format(amount);

String formatOfficialDate(DateTime date) =>
    DateFormat('dd.MM.yyyy').format(date);

/// Nombre de archivo sin caracteres especiales (Android no siempre los admite).
String officialPdfFileName(DateTime date) =>
    'OestiTax-Berechnung-${DateFormat('dd-MM-yyyy').format(date)}.pdf';

/// Filas "Eingaben" del PDF (etiqueta, valor). Pura y sin Flutter: se prueba aparte.
/// Espejo de buildInputRows en web/src/app/core/pdf/text-pdf.util.ts.
List<(String, String)> pdfInputRows(CalculateRequest r) {
  String yesNo(bool value) => value ? PdfOfficialDe.yes : PdfOfficialDe.no;

  final rows = <(String, String)>[
    (
      PdfOfficialDe.labelEmployment,
      PdfOfficialDe.employment[r.employmentType]!,
    ),
    (
      PdfOfficialDe.labelGross,
      '${formatOfficialEuro(r.grossAmount)} (${PdfOfficialDe.incomePeriod[r.incomePeriod]})',
    ),
    (PdfOfficialDe.labelState, PdfOfficialDe.states[r.state]!),
    (PdfOfficialDe.labelSoleEarner, yesNo(r.soleEarnerDeduction)),
    (PdfOfficialDe.labelFamilyBonus, PdfOfficialDe.familyBonus[r.familyBonus]!),
  ];

  if (r.soleEarnerDeduction ||
      r.familyBonus != FamilyBonusType.none ||
      r.childrenUnder18 > 0 ||
      r.childrenOver18WithFamilyAllowance > 0) {
    rows.addAll([
      (PdfOfficialDe.labelChildrenUnder18, '${r.childrenUnder18}'),
      (
        PdfOfficialDe.labelChildrenOver18,
        '${r.childrenOver18WithFamilyAllowance}',
      ),
    ]);
  }

  rows.add((
    PdfOfficialDe.labelBenefitInKind,
    formatOfficialEuro(r.benefitInKindMonthly),
  ));
  rows.add((
    PdfOfficialDe.labelCompanyCar,
    yesNo(r.benefitInKindFromCompanyCar),
  ));

  final car = r.companyCar;
  if (r.benefitInKindFromCompanyCar && car != null) {
    rows.addAll([
      (
        '  ${PdfOfficialDe.labelCarCost}',
        formatOfficialEuro(car.acquisitionCost),
      ),
      ('  ${PdfOfficialDe.labelCarCo2}', '${car.co2GramsPerKm}'),
      ('  ${PdfOfficialDe.labelCarYear}', '${car.firstRegistrationYear}'),
      ('  ${PdfOfficialDe.labelCarHalf}', yesNo(car.halfBenefit)),
    ]);
  }

  rows.add((
    PdfOfficialDe.labelTaxFreeAllowance,
    formatOfficialEuro(r.taxFreeAllowanceMonthly),
  ));

  if (!r.benefitInKindFromCompanyCar && r.commuteOneWayKm > 0) {
    rows.addAll([
      (PdfOfficialDe.labelCommuteKm, '${_trimKm(r.commuteOneWayKm)} km'),
      (PdfOfficialDe.labelPublicTransport, yesNo(r.publicTransportReasonable)),
      (
        PdfOfficialDe.labelCommuteDays,
        PdfOfficialDe.commuteDays[r.commuteDaysPerMonth]!,
      ),
    ]);
  }

  return rows;
}

String _trimKm(double km) =>
    km == km.roundToDouble() ? km.toStringAsFixed(0) : km.toString();

/// Nivel del PDF: `basic` (gratis, una página con aviso de Pro) o `pro` (informe completo).
enum PdfTier { basic, pro }

/// Lo que el usuario marcó y se tuvo en cuenta. Espejo de buildAppliedLines de la web.
List<String> pdfAppliedLines(CalculateRequest r) {
  final lines = <String>[];
  if (r.soleEarnerDeduction) lines.add(PdfExtraDe.appliedSoleEarner);
  if (r.familyBonus == FamilyBonusType.full) {
    lines.add(PdfExtraDe.appliedFamilyBonusFull);
  }
  if (r.familyBonus == FamilyBonusType.shared) {
    lines.add(PdfExtraDe.appliedFamilyBonusShared);
  }
  if (r.childrenUnder18 > 0 || r.childrenOver18WithFamilyAllowance > 0) {
    lines.add(
      PdfExtraDe.appliedChildren
          .replaceAll('{u18}', '${r.childrenUnder18}')
          .replaceAll('{o18}', '${r.childrenOver18WithFamilyAllowance}'),
    );
  }
  if (!r.benefitInKindFromCompanyCar && r.commuteOneWayKm > 0) {
    lines.add(
      PdfExtraDe.appliedCommute.replaceAll('{km}', _trimKm(r.commuteOneWayKm)),
    );
  }
  if (r.taxFreeAllowanceMonthly > 0) {
    lines.add(
      PdfExtraDe.appliedAllowance.replaceAll(
        '{amount}',
        formatOfficialEuro(r.taxFreeAllowanceMonthly),
      ),
    );
  }
  if (r.benefitInKindMonthly > 0) {
    lines.add(
      PdfExtraDe.appliedBenefitInKind.replaceAll(
        '{amount}',
        formatOfficialEuro(r.benefitInKindMonthly),
      ),
    );
  }
  if (r.benefitInKindFromCompanyCar) lines.add(PdfExtraDe.appliedCompanyCar);
  return lines;
}

/// Consejos generales según los datos. Espejo de buildTips de la web.
List<String> pdfTips(CalculateRequest r) {
  final hasChildren =
      r.childrenUnder18 > 0 || r.childrenOver18WithFamilyAllowance > 0;
  return [
    if (hasChildren && r.familyBonus == FamilyBonusType.none)
      PdfExtraDe.tipFamilyBonus,
    if (hasChildren && !r.soleEarnerDeduction) PdfExtraDe.tipSoleEarner,
    if (!r.benefitInKindFromCompanyCar && r.commuteOneWayKm <= 0)
      PdfExtraDe.tipCommute,
    if (r.taxFreeAllowanceMonthly <= 0) PdfExtraDe.tipAllowance,
    PdfExtraDe.tipReceipts,
    PdfExtraDe.tipVeranlagung,
  ];
}

/// Genera el PDF (siempre en alemán) con el mismo diseño que la web.
Future<Uint8List> buildCalculationPdf({
  required CalculateRequest request,
  required CalculateResponse response,
  DateTime? now,
  PdfTier tier = PdfTier.pro,
}) async {
  final date = now ?? DateTime.now();
  // Roboto (Apache 2.0, ver assets/fonts/ROBOTO_LICENSE.txt): trae "€" y las diéresis,
  // que las fuentes estándar del PDF no cubren.
  final regular = pw.Font.ttf(
    await rootBundle.load('assets/fonts/roboto-regular.ttf'),
  );
  final bold = pw.Font.ttf(
    await rootBundle.load('assets/fonts/roboto-bold.ttf'),
  );

  final doc = pw.Document(
    title: '${PdfOfficialDe.productName} - ${PdfOfficialDe.documentTitle}',
    author: PdfOfficialDe.productName,
    theme: pw.ThemeData.withFont(base: regular, bold: bold),
  );

  pw.Widget pad(pw.Widget child) => pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: _marginX),
    child: child,
  );

  final body = tier == PdfTier.basic
      ? _basicBody(request, response)
      : [..._fullBody(request, response), ..._extraBody(request)];

  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: pw.EdgeInsets.zero,
      header: (context) => _header(response.tableYear, date),
      footer: (context) => _footer(context.pageNumber, context.pagesCount),
      build: (context) => [
        pw.SizedBox(height: 26),
        for (final w in body) pad(w),
        pw.SizedBox(height: 16),
      ],
    ),
  );

  return doc.save();
}

/// Página 1 del PDF completo: todas las entradas y las cuatro columnas de resultados.
List<pw.Widget> _fullBody(
  CalculateRequest request,
  CalculateResponse response,
) {
  return [
    _sectionTitle(PdfOfficialDe.sectionInputs),
    pw.SizedBox(height: 10),
    for (final (label, value) in pdfInputRows(request)) _inputRow(label, value),
    pw.SizedBox(height: 22),
    _sectionTitle(PdfOfficialDe.sectionResult),
    pw.SizedBox(height: 12),
    _resultTable(response),
    pw.SizedBox(height: 26),
    _disclaimer(),
  ];
}

/// PDF básico: resumen, datos básicos y desglose general, más el aviso de mejora a Pro.
/// El aviso no lleva enlace ni precio: la versión de Google Play no vende suscripciones.
List<pw.Widget> _basicBody(
  CalculateRequest request,
  CalculateResponse response,
) {
  final rows = <(String, String)>[
    (
      PdfOfficialDe.labelEmployment,
      PdfOfficialDe.employment[request.employmentType]!,
    ),
    (
      PdfOfficialDe.labelGross,
      '${formatOfficialEuro(request.grossAmount)} (${PdfOfficialDe.incomePeriod[request.incomePeriod]})',
    ),
    (PdfOfficialDe.labelState, PdfOfficialDe.states[request.state]!),
  ];
  return [
    _sectionTitle(PdfExtraDe.basicSummary),
    pw.SizedBox(height: 12),
    pw.Container(
      color: _successTint,
      padding: const pw.EdgeInsets.all(12),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                PdfExtraDe.basicNetLabel,
                style: pw.TextStyle(
                  color: _success,
                  fontSize: 10.5,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.Text(
                formatOfficialEuro(response.recurring.net),
                style: pw.TextStyle(
                  color: _success,
                  fontSize: 20,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 6),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                PdfExtraDe.basicAnnualNet,
                style: const pw.TextStyle(color: _muted, fontSize: 9.5),
              ),
              pw.Text(
                formatOfficialEuro(response.annual.net),
                style: const pw.TextStyle(color: _muted, fontSize: 9.5),
              ),
            ],
          ),
        ],
      ),
    ),
    pw.SizedBox(height: 22),
    _sectionTitle(PdfExtraDe.basicInputs),
    pw.SizedBox(height: 10),
    for (final (label, value) in rows) _inputRow(label, value),
    pw.SizedBox(height: 22),
    _sectionTitle(PdfExtraDe.basicOverview),
    pw.SizedBox(height: 12),
    _resultTable(response, general: true),
    pw.SizedBox(height: 26),
    _disclaimer(),
    pw.SizedBox(height: 24),
    pw.Container(
      color: _brand,
      padding: const pw.EdgeInsets.all(14),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            PdfExtraDe.upgradeTitle,
            style: pw.TextStyle(
              color: _white,
              fontSize: 13,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.SizedBox(height: 6),
          pw.Text(
            PdfExtraDe.upgradeBody,
            style: const pw.TextStyle(color: _white, fontSize: 9.5),
          ),
        ],
      ),
    ),
  ];
}

/// Páginas de explicaciones, consejos y guía del PDF completo.
List<pw.Widget> _extraBody(CalculateRequest request) {
  pw.Widget paragraph(String text, {bool muted = false, double size = 9.5}) =>
      pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 6),
        child: pw.Text(
          text,
          style: pw.TextStyle(
            color: muted ? _muted : _text,
            fontSize: size,
            lineSpacing: 2,
          ),
        ),
      );

  pw.Widget bullet(String marker, String text) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 6, left: 4),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(
          width: 16,
          child: pw.Text(
            marker,
            style: const pw.TextStyle(color: _brand, fontSize: 9.5),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            text,
            style: const pw.TextStyle(
              color: _text,
              fontSize: 9.5,
              lineSpacing: 2,
            ),
          ),
        ),
      ],
    ),
  );

  final applied = pdfAppliedLines(request);
  return [
    pw.NewPage(),
    _sectionTitle(PdfExtraDe.appliedTitle),
    pw.SizedBox(height: 10),
    if (applied.isEmpty)
      paragraph(PdfExtraDe.appliedNone, muted: true)
    else
      for (final line in applied) bullet('-', line),
    pw.SizedBox(height: 16),
    _sectionTitle(PdfExtraDe.explainTitle),
    pw.SizedBox(height: 10),
    for (final (heading, text) in PdfExtraDe.explain) ...[
      pw.Text(
        heading,
        style: pw.TextStyle(
          color: _text,
          fontSize: 10,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
      pw.SizedBox(height: 3),
      paragraph(text, muted: true),
    ],
    pw.SizedBox(height: 12),
    _sectionTitle(PdfExtraDe.tipsTitle),
    pw.SizedBox(height: 10),
    paragraph(PdfExtraDe.tipsIntro, muted: true, size: 9),
    for (final tip in pdfTips(request)) bullet('-', tip),
    pw.SizedBox(height: 12),
    _sectionTitle(PdfExtraDe.guideTitle),
    pw.SizedBox(height: 10),
    for (final (i, step) in PdfExtraDe.guide.indexed) bullet('${i + 1}.', step),
    pw.SizedBox(height: 6),
    paragraph(PdfExtraDe.guideNote, muted: true, size: 8),
  ];
}

pw.Widget _header(int tableYear, DateTime date) {
  return pw.Container(
    color: _brand,
    height: 74,
    padding: const pw.EdgeInsets.fromLTRB(_marginX, 16, _marginX, 0),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              PdfOfficialDe.productName,
              style: pw.TextStyle(
                color: _white,
                fontSize: 19,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(
              PdfOfficialDe.documentTitle,
              style: const pw.TextStyle(color: _white, fontSize: 10.5),
            ),
          ],
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text(
              '${PdfOfficialDe.standPrefix}: $tableYear',
              style: const pw.TextStyle(color: _white, fontSize: 9),
            ),
            pw.SizedBox(height: 3),
            pw.Text(
              '${PdfOfficialDe.createdPrefix}: ${formatOfficialDate(date)}',
              style: const pw.TextStyle(color: _white, fontSize: 9),
            ),
          ],
        ),
      ],
    ),
  );
}

pw.Widget _sectionTitle(String title) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.stretch,
    children: [
      pw.Text(
        title,
        style: pw.TextStyle(
          color: _brand,
          fontSize: 12.5,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
      pw.SizedBox(height: 6),
      pw.Container(height: 1, color: _border),
    ],
  );
}

pw.Widget _inputRow(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 6),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(
          width: _labelWidth,
          child: pw.Text(
            label,
            style: const pw.TextStyle(color: _muted, fontSize: 9.5),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            value,
            style: pw.TextStyle(
              color: _text,
              fontSize: 9.5,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        ),
      ],
    ),
  );
}

pw.Widget _resultTable(CalculateResponse response, {bool general = false}) {
  final labelWidth = general ? 260.0 : 150.0;
  final breakdowns = general
      ? [response.recurring, response.annual]
      : [
          response.recurring,
          response.thirteenth,
          response.fourteenth,
          response.annual,
        ];
  final titles = general
      ? const [PdfOfficialDe.columnRecurring, PdfOfficialDe.columnAnnual]
      : const [
          PdfOfficialDe.columnRecurring,
          PdfOfficialDe.columnThirteenth,
          PdfOfficialDe.columnFourteenth,
          PdfOfficialDe.columnAnnual,
        ];

  pw.Widget numberCell(String text, pw.TextStyle style) => pw.Expanded(
    child: pw.Text(text, textAlign: pw.TextAlign.right, style: style),
  );

  pw.Widget dataRow(
    String label,
    double Function(PaymentBreakdown) pick, {
    bool deduction = false,
  }) {
    final style = pw.TextStyle(
      color: deduction ? _muted : _text,
      fontSize: 9.5,
    );
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: labelWidth,
            child: pw.Text(
              label,
              style: const pw.TextStyle(color: _text, fontSize: 9.5),
            ),
          ),
          for (final b in breakdowns)
            numberCell(
              '${deduction ? '- ' : ''}${formatOfficialEuro(pick(b))}',
              style,
            ),
        ],
      ),
    );
  }

  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.stretch,
    children: [
      pw.Row(
        children: [
          pw.SizedBox(width: labelWidth),
          for (final title in titles)
            numberCell(
              title,
              pw.TextStyle(
                color: _muted,
                fontSize: 8.5,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
        ],
      ),
      pw.SizedBox(height: 6),
      pw.Container(height: 1, color: _border),
      pw.SizedBox(height: 10),
      dataRow(PdfOfficialDe.rowGross, (b) => b.gross),
      dataRow(
        PdfOfficialDe.rowSocialInsurance,
        (b) => b.socialInsurance,
        deduction: true,
      ),
      dataRow(PdfOfficialDe.rowIncomeTax, (b) => b.incomeTax, deduction: true),
      pw.SizedBox(height: 2),
      pw.Container(
        color: _successTint,
        padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 7),
        child: pw.Row(
          children: [
            pw.SizedBox(
              width: labelWidth - 8,
              child: pw.Text(
                PdfOfficialDe.rowNet,
                style: pw.TextStyle(
                  color: _success,
                  fontSize: 10.5,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            for (final b in breakdowns)
              numberCell(
                formatOfficialEuro(b.net),
                pw.TextStyle(
                  color: _success,
                  fontSize: 10.5,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
          ],
        ),
      ),
    ],
  );
}

pw.Widget _disclaimer() {
  return pw.Container(
    color: _brandTint,
    padding: const pw.EdgeInsets.all(10),
    child: pw.Text(
      PdfOfficialDe.disclaimer,
      style: const pw.TextStyle(color: _muted, fontSize: 8, lineSpacing: 2),
    ),
  );
}

pw.Widget _footer(int page, int pages) {
  return pw.Padding(
    padding: const pw.EdgeInsets.fromLTRB(_marginX, 0, _marginX, 22),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
      children: [
        pw.Container(height: 1, color: _border),
        pw.SizedBox(height: 8),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              '${PdfOfficialDe.productName} - ${PdfOfficialDe.footerTagline}',
              style: const pw.TextStyle(color: _muted, fontSize: 8),
            ),
            pw.Text(
              '${PdfExtraDe.pageWord} $page/$pages',
              style: const pw.TextStyle(color: _muted, fontSize: 8),
            ),
          ],
        ),
      ],
    ),
  );
}
