import '../domain/calculation_models.dart';

/// Terminología oficial alemana (Amtssprache) del PDF. El PDF sale siempre en alemán,
/// independientemente del idioma de la UI (ver CLAUDE.md). Espejo de
/// web/src/app/core/pdf/pdf-official-de.ts: mantener ambos alineados.
abstract final class PdfOfficialDe {
  static const documentTitle = 'Brutto-Netto-Berechnung';
  static const productName = 'ÖstiTax';
  static const footerTagline = 'Digitaler Nettogehalt-Rechner für Österreich';
  static const standPrefix = 'Stand';
  static const createdPrefix = 'Erstellt am';
  static const sectionInputs = 'Eingaben';
  static const sectionResult = 'Ergebnis';
  static const disclaimer =
      'Diese Berechnung dient als Orientierungshilfe. Das Ergebnis entspricht '
      'dem dargestellten Bezug bei 14 gleich hohen Monatsbezügen. Abweichungen '
      'durch Sonderzahlungen, Sachbezüge oder Freibeträge sind möglich.';

  static const yes = 'Ja';
  static const no = 'Nein';

  static const employment = {
    EmploymentType.employee: 'Arbeiter(in) / Angestellte(r)',
    EmploymentType.apprentice: 'Lehrling',
    EmploymentType.pensioner: 'Pensionist(in)',
  };

  static const incomePeriod = {
    IncomePeriod.monthly: 'Monatlich',
    IncomePeriod.yearly: 'Jährlich',
  };

  static const states = {
    AustrianState.wien: 'Wien',
    AustrianState.niederoesterreich: 'Niederösterreich',
    AustrianState.oberoesterreich: 'Oberösterreich',
    AustrianState.burgenland: 'Burgenland',
    AustrianState.salzburg: 'Salzburg',
    AustrianState.steiermark: 'Steiermark',
    AustrianState.kaernten: 'Kärnten',
    AustrianState.tirol: 'Tirol',
    AustrianState.vorarlberg: 'Vorarlberg',
  };

  static const familyBonus = {
    FamilyBonusType.none: 'Kein Bonus',
    FamilyBonusType.full: 'Voller Bonus',
    FamilyBonusType.shared: 'Geteilter Bonus',
  };

  static const commuteDays = {
    CommuteDaysPerMonth.lessThan4: 'Weniger als 4 Tage',
    CommuteDaysPerMonth.from4to7: '4 bis 7 Tage',
    CommuteDaysPerMonth.from8to10: '8 bis 10 Tage',
    CommuteDaysPerMonth.moreThan10: 'Mehr als 10 Tage',
  };

  static const labelEmployment = 'Beschäftigung';
  static const labelGross = 'Bruttobezug';
  static const labelState = 'Arbeitsort (Bundesland)';
  static const labelSoleEarner = 'Alleinverdiener-/Alleinerzieherabsetzbetrag';
  static const labelFamilyBonus = 'Familienbonus Plus';
  static const labelBenefitInKind = 'Sachbezug (monatlich)';
  static const labelCompanyCar = 'Firmenauto (Sachbezug KFZ)';
  static const labelTaxFreeAllowance = 'Monatlicher Freibetrag';
  static const labelChildrenUnder18 = 'Kinder unter 18';
  static const labelChildrenOver18 = 'Kinder über 18 (Familienbeihilfe)';
  static const labelCarCost = 'Anschaffungswert';
  static const labelCarCo2 = 'CO2 (g/km)';
  static const labelCarYear = 'Erstzulassung';
  static const labelCarHalf = 'Halber Sachbezug';
  static const labelCommuteKm = 'Einfache Wegstrecke (km)';
  static const labelPublicTransport = 'Öffentlicher Verkehr zumutbar';
  static const labelCommuteDays = 'Pendeltage pro Monat';

  static const columnRecurring = 'Bezug laufend';
  static const columnThirteenth = '13. Bezug';
  static const columnFourteenth = '14. Bezug';
  static const columnAnnual = 'Jahresbezug';

  static const rowGross = 'Bruttobezug';
  static const rowSocialInsurance = 'Sozialversicherung';
  static const rowIncomeTax = 'Lohnsteuer';
  static const rowNet = 'Nettobezug';
}
