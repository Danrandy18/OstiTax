/** Terminología oficial alemana (Amtssprache) — PDF siempre DE, independiente del idioma UI. */
export const PDF_OFFICIAL_DE = {
  documentTitle: 'Brutto-Netto-Berechnung',
  productName: 'ÖstiTax',
  standPrefix: 'Stand',
  createdPrefix: 'Erstellt am',
  sectionInputs: 'Eingaben',
  sectionResult: 'Ergebnis',
  pageLabel: 'Seite 1/1',
  disclaimer:
    'Diese Berechnung dient als Orientierungshilfe. Das Ergebnis entspricht dem dargestellten Bezug bei 14 gleich hohen Monatsbezügen. Abweichungen durch Sonderzahlungen, Sachbezüge oder Freibeträge sind möglich.',
  employment: {
    employee: 'Arbeiter(in) / Angestellte(r)',
    apprentice: 'Lehrling',
    pensioner: 'Pensionist(in)',
  },
  incomePeriod: {
    monthly: 'Monatlich',
    yearly: 'Jährlich',
  },
  labels: {
    employment: 'Beschäftigung',
    gross: 'Bruttobezug',
    state: 'Arbeitsort (Bundesland)',
    soleEarner: 'Alleinverdiener-/Alleinerzieherabsetzbetrag',
    familyBonus: 'Familienbonus Plus',
    benefitInKind: 'Sachbezug (monatlich)',
    companyCar: 'Firmenauto (Sachbezug KFZ)',
    taxFreeAllowance: 'Monatlicher Freibetrag',
    commute: 'Pendlerpauschale',
    childrenUnder18: 'Kinder unter 18',
    childrenOver18: 'Kinder ueber 18 (Familienbeihilfe)',
    companyCarAcquisitionCost: 'Anschaffungswert',
    companyCarCo2: 'CO2 (g/km)',
    companyCarRegistrationYear: 'Erstzulassung',
    companyCarHalfBenefit: 'Halber Sachbezug',
    commuteKm: 'Einfache Wegstrecke (km)',
    publicTransportReasonable: 'Oeffentlicher Verkehr zumutbar',
    commuteDaysLabel: 'Pendeltage pro Monat',
  },
  familyBonus: {
    none: 'Kein Bonus',
    full: 'Voller Bonus',
    shared: 'Geteilter Bonus',
  },
  yesNo: { yes: 'Ja', no: 'Nein' },
  columns: {
    recurring: 'Bezug laufend',
    thirteenth: '13. Bezug',
    fourteenth: '14. Bezug',
    annual: 'Jahresbezug',
  },
  rows: {
    gross: 'Bruttobezug',
    socialInsurance: 'Sozialversicherung',
    incomeTax: 'Lohnsteuer',
    net: 'Nettobezug',
  },
  states: {
    wien: 'Wien',
    niederoesterreich: 'Niederösterreich',
    oberoesterreich: 'Oberösterreich',
    burgenland: 'Burgenland',
    salzburg: 'Salzburg',
    steiermark: 'Steiermark',
    kaernten: 'Kärnten',
    tirol: 'Tirol',
    vorarlberg: 'Vorarlberg',
  },
  commuteDays: {
    less_than_4: 'Weniger als 4 Tage',
    from_4_to_7: '4 bis 7 Tage',
    from_8_to_10: '8 bis 10 Tage',
    more_than_10: 'Mehr als 10 Tage',
  },
} as const;

export function formatOfficialEuro(amount: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatOfficialDate(date: Date): string {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
