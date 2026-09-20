import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../domain/calculation_models.dart';
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

/// Genera el PDF oficial (siempre en alemán) con el mismo diseño que la web.
Future<Uint8List> buildCalculationPdf({
  required CalculateRequest request,
  required CalculateResponse response,
  DateTime? now,
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

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: pw.EdgeInsets.zero,
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          _header(response.tableYear, date),
          pw.Padding(
            padding: const pw.EdgeInsets.fromLTRB(_marginX, 30, _marginX, 0),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                _sectionTitle(PdfOfficialDe.sectionInputs),
                pw.SizedBox(height: 10),
                for (final (label, value) in pdfInputRows(request))
                  _inputRow(label, value),
                pw.SizedBox(height: 22),
                _sectionTitle(PdfOfficialDe.sectionResult),
                pw.SizedBox(height: 12),
                _resultTable(response),
                pw.SizedBox(height: 26),
                _disclaimer(),
              ],
            ),
          ),
          pw.Spacer(),
          _footer(),
        ],
      ),
    ),
  );

  return doc.save();
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

pw.Widget _resultTable(CalculateResponse response) {
  const labelWidth = 150.0;
  final breakdowns = [
    response.recurring,
    response.thirteenth,
    response.fourteenth,
    response.annual,
  ];
  const titles = [
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

pw.Widget _footer() {
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
              PdfOfficialDe.pageLabel,
              style: const pw.TextStyle(color: _muted, fontSize: 8),
            ),
          ],
        ),
      ],
    ),
  );
}
