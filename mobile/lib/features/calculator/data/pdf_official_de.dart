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
    EmploymentType.selfEmployed: 'Selbstständig',
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

  // Autonomos (mismos textos que la web: ver web/src/app/core/i18n/translations.ts, "de").
  static const seLabelProfit = 'Jahresgewinn vor SV';
  static const seLabelKind = 'Art der Tätigkeit';
  static const seKind = {
    SelfEmployedKind.trade: 'Gewerbe',
    SelfEmployedKind.newSelfEmployed: 'Neue Selbständige',
  };
  static const seLabelFirstYears = 'In den ersten 3 Jahren';
  static const seColumnMonthly = 'Monatlicher Durchschnitt';
  static const seColumnAnnual = 'Jahr';
  static const seRowProfit = 'Gewinn vor SV';
  static const seRowSocialInsurance = 'SVS-Beiträge';
  static const seRowIncomeTax = 'Einkommensteuer';
  static const seRowNet = 'Netto-Einkommen';
  static const seDetailTitle = 'So setzt sich das Ergebnis zusammen';
  static const sePension = 'Pensionsversicherung (18,5 %)';
  static const seHealth = 'Krankenversicherung (6,8 %)';
  static const seProvision = 'Selbständigenvorsorge (1,53 %)';
  static const seAccident = 'Unfallversicherung';
  static const seGewinnfreibetrag = 'Gewinnfreibetrag (15 %)';
  static const seTaxable = 'Zu versteuerndes Einkommen';
  static const seTariffTax = 'Einkommensteuer laut Tarif';
  static const seFamilyBonus = 'Familienbonus Plus';
  static const seSoleEarner = 'Alleinverdienerabsetzbetrag';
  static const seQuarterlySocialInsurance = 'SVS-Beiträge pro Quartal';
  static const seQuarterlyTax =
      'Einkommensteuer-Vorauszahlung pro Quartal (Richtwert)';
  static const seBackPayment =
      'Achtung Nachzahlung: Die SVS verrechnet anfangs {provisional} pro Jahr. '
      'Mit dem Gewinn sind es {final}. Rund {backPayment} für die spätere '
      'Nachbemessung zur Seite legen.';
  static const seMinBase =
      'Der Gewinn liegt unter der Mindestbeitragsgrundlage: Es fallen trotzdem '
      'die Mindestbeiträge an.';
  static const seMaxBase =
      'Der Gewinn liegt über der Höchstbeitragsgrundlage: Die Beiträge sind '
      'gedeckelt.';
  static const seNotInsured =
      'Neue Selbständige unter der Versicherungsgrenze (6.613,20 €/Jahr) sind '
      'nicht pflichtversichert; eine freiwillige Versicherung ist möglich.';
  static const seDisclaimer =
      'Schätzung für Gewerbetreibende und Neue Selbständige (GSVG) 2026. Nicht '
      'enthalten: investitionsbedingter Gewinnfreibetrag über 33.000 €, '
      'Umsatzsteuer, Pauschalierungen und Kammer-Freiberufler (z. B. Ärzte, '
      'Anwälte).';
}
