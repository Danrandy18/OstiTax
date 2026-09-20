import 'dart:io';

import 'package:app_calculos/features/calculator/data/calculation_pdf.dart';
import 'package:app_calculos/features/calculator/domain/calculation_models.dart';
import 'package:flutter_test/flutter_test.dart';

const _response = CalculateResponse(
  tableYear: 2026,
  recurring: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 549.6,
    incomeTax: 281.57,
    net: 2168.83,
  ),
  thirteenth: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 0,
    incomeTax: 120,
    net: 2880,
  ),
  fourteenth: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 0,
    incomeTax: 120,
    net: 2880,
  ),
  annual: PaymentBreakdown(
    gross: 42000,
    socialInsurance: 6595.2,
    incomeTax: 3378.84,
    net: 32025.96,
  ),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('filas de entradas del PDF (siempre en alemán)', () {
    test('caso básico: 5 filas más franquicia', () {
      final rows = pdfInputRows(const CalculateRequest());
      final labels = rows.map((r) => r.$1).toList();

      expect(labels.first, 'Beschäftigung');
      expect(rows.first.$2, 'Arbeiter(in) / Angestellte(r)');
      expect(labels, contains('Bruttobezug'));
      expect(labels, contains('Monatlicher Freibetrag'));
      // Sin hijos ni bonus no se listan las filas de hijos.
      expect(labels, isNot(contains('Kinder unter 18')));
      // Sin trayecto no se listan las filas de Pendlerpauschale.
      expect(labels, isNot(contains('Pendeltage pro Monat')));
    });

    test('formatea el importe y el periodo como la web', () {
      final rows = pdfInputRows(const CalculateRequest(grossAmount: 3000));
      final gross = rows.firstWhere((r) => r.$1 == 'Bruttobezug').$2;

      // Como la web: punto para los miles, coma para los decimales y el € delante.
      expect(gross, startsWith('€${String.fromCharCode(0xA0)}3.000,00'));
      expect(gross, contains('€'));
      expect(gross, contains('(Monatlich)'));
    });

    test('con hijos o bonus aparecen las filas de hijos', () {
      final rows = pdfInputRows(
        const CalculateRequest(
          familyBonus: FamilyBonusType.full,
          childrenUnder18: 2,
        ),
      );
      final children = rows.firstWhere((r) => r.$1 == 'Kinder unter 18').$2;

      expect(children, '2');
    });

    test('con trayecto aparecen las filas de Pendlerpauschale', () {
      final rows = pdfInputRows(const CalculateRequest(commuteOneWayKm: 25));
      final km = rows.firstWhere((r) => r.$1 == 'Einfache Wegstrecke (km)').$2;

      expect(km, '25 km');
      expect(
        rows.map((r) => r.$1),
        containsAll(['Öffentlicher Verkehr zumutbar', 'Pendeltage pro Monat']),
      );
    });

    test(
      'con Firmenauto no se listan el trayecto y sí los datos del coche',
      () {
        final rows = pdfInputRows(
          const CalculateRequest(
            benefitInKindFromCompanyCar: true,
            commuteOneWayKm: 25,
            companyCar: CompanyCarInput(
              acquisitionCost: 40000,
              co2GramsPerKm: 120,
              firstRegistrationYear: 2024,
            ),
          ),
        );
        final labels = rows.map((r) => r.$1.trim()).toList();

        expect(labels, contains('Anschaffungswert'));
        expect(labels, contains('CO2 (g/km)'));
        expect(labels, isNot(contains('Einfache Wegstrecke (km)')));
      },
    );
  });

  group('nombre de archivo', () {
    test('sin caracteres especiales', () {
      expect(
        officialPdfFileName(DateTime(2026, 9, 20)),
        'OestiTax-Berechnung-20-09-2026.pdf',
      );
    });
  });

  group('generación del PDF', () {
    test('produce un PDF válido con fuentes incluidas', () async {
      final bytes = await buildCalculationPdf(
        request: const CalculateRequest(
          familyBonus: FamilyBonusType.full,
          childrenUnder18: 1,
          commuteOneWayKm: 30,
        ),
        response: _response,
        now: DateTime(2026, 9, 20),
      );

      expect(String.fromCharCodes(bytes.take(5)), '%PDF-');
      // Las fuentes se incrustan solo con los glifos usados: pesa poco, pero no está vacío.
      expect(bytes.length, greaterThan(5000));
    });

    test('deja una muestra en build/ para revisarla a ojo', () async {
      final bytes = await buildCalculationPdf(
        request: const CalculateRequest(
          familyBonus: FamilyBonusType.full,
          childrenUnder18: 1,
          commuteOneWayKm: 30,
        ),
        response: _response,
        now: DateTime(2026, 9, 20),
      );
      final file = File('build/test_output/muestra.pdf');
      await file.parent.create(recursive: true);
      await file.writeAsBytes(bytes);

      expect(await file.exists(), isTrue);
    });
  });
}
