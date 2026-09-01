export type Lang = 'de' | 'en' | 'tr' | 'bcs' | 'es' | 'uk';

export interface TranslationSchema {
  appTitle: string;
  appSubtitle: string;
  seoHero: string;
  seoLead: string;
  calculate: string;
  calculating: string;
  iAm: string;
  employmentEmployee: string;
  employmentApprentice: string;
  employmentPensioner: string;
  employmentComingSoon: string;
  grossAmount: string;
  grossAmountMonthly: string;
  grossAmountYearly: string;
  incomePeriod: string;
  monthly: string;
  yearly: string;
  state: string;
  deductions: string;
  soleEarner: string;
  yes: string;
  no: string;
  familyBonus: string;
  familyBonusNone: string;
  familyBonusFull: string;
  familyBonusShared: string;
  childrenUnder18: string;
  childrenOver18: string;
  benefitInKind: string;
  companyCarBenefit: string;
  companyCarHint: string;
  companyCarAcquisitionCost: string;
  companyCarCo2: string;
  companyCarRegistrationYear: string;
  companyCarHalfBenefit: string;
  taxFreeAllowance: string;
  commute: string;
  commuteBlockedByCompanyCar: string;
  commuteHint: string;
  commuteKm: string;
  commuteDays: string;
  commuteDaysLess4: string;
  commuteDays4to7: string;
  commuteDays8to10: string;
  commuteDaysMore10: string;
  publicTransportReasonable: string;
  results: string;
  recurring: string;
  thirteenth: string;
  fourteenth: string;
  annual: string;
  gross: string;
  socialInsurance: string;
  incomeTax: string;
  net: string;
  tableYear: string;
  exportPdf: string;
  exportPdfProHint: string;
  attemptsRemaining: string;
  proBadge: string;
  paymentRequired: string;
  paymentRequiredHint: string;
  upgradeToPro: string;
  paymentModalTitle: string;
  paymentModalSubtitle: string;
  payWithStripe: string;
  payWithPaypal: string;
  planMonthlyTitle: string;
  planMonthlyPrice: string;
  planMonthlyBenefit: string;
  planSemiannualTitle: string;
  planSemiannualPrice: string;
  planSemiannualPerMonth: string;
  planSemiannualBadge: string;
  planSemiannualBenefit: string;
  planAnnualTitle: string;
  planAnnualPrice: string;
  planAnnualPerMonth: string;
  planAnnualBadge: string;
  planAnnualBenefit: string;
  planSelectHeading: string;
  paymentMethodHeading: string;
  payMethodCardTitle: string;
  payMethodCardDesc: string;
  payMethodPaypalTitle: string;
  payMethodPaypalDesc: string;
  cancel: string;
  close: string;
  loading: string;
  errorGeneric: string;
  paymentSuccessTitle: string;
  paymentSuccessBody: string;
  paymentCancelTitle: string;
  paymentCancelBody: string;
  backToCalculator: string;
  refreshStatus: string;
  language: string;
  faqTitle: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  iAmHint: string;
  incomePeriodHint: string;
  stateHint: string;
  soleEarnerHint: string;
  familyBonusHint: string;
  benefitInKindHint: string;
  taxFreeAllowanceHint: string;
  states: Record<string, string>;
}

const stateKeys = [
  'wien',
  'niederoesterreich',
  'oberoesterreich',
  'burgenland',
  'salzburg',
  'steiermark',
  'kaernten',
  'tirol',
  'vorarlberg',
] as const;

function states(de: Record<string, string>): Record<string, string> {
  return Object.fromEntries(stateKeys.map((k) => [k, de[k] ?? k]));
}

export const TRANSLATIONS: Record<Lang, TranslationSchema> = {
  de: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Gehalt netto berechnen · Österreich 2026',
    seoHero: 'Dein Nettogehalt — klar berechnet',
    seoLead:
      'Brutto zu Netto in Sekunden: Lohnsteuer, Sozialversicherung, 13./14. Gehalt, Familienbonus und Pendlerpauschale.',
    calculate: 'Jetzt berechnen',
    calculating: 'Wird berechnet…',
    iAm: 'Ich bin',
    employmentEmployee: 'Arbeiter(in) / Angestellte(r)',
    employmentApprentice: 'Lehrling',
    employmentPensioner: 'Pensionist(in)',
    employmentComingSoon: 'Bald verfügbar',
    grossAmount: 'Bruttobezug (€)',
    grossAmountMonthly: 'Brutto monatlich (€)',
    grossAmountYearly: 'Brutto jährlich (€)',
    incomePeriod: 'Meine Bezüge',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    state: 'Arbeitsort (Bundesland)',
    deductions: 'Absetzbeträge',
    soleEarner: 'Alleinverdiener-/Alleinerzieherabsetzbetrag',
    yes: 'Ja',
    no: 'Nein',
    familyBonus: 'Familienbonus Plus',
    familyBonusNone: 'Kein Bonus',
    familyBonusFull: 'Voller Bonus',
    familyBonusShared: 'Geteilter Bonus',
    childrenUnder18: 'Kinder unter 18',
    childrenOver18: 'Kinder 18+ (Familienbeihilfe)',
    benefitInKind: 'Monatlicher Sachbezug (€)',
    companyCarBenefit: 'Sachbezug wegen Firmenauto',
    companyCarHint:
      'Bei Firmenauto entfällt die Pendlerpauschale. Optional: Fahrzeugdaten für automatischen KFZ-Sachbezug (BMF).',
    companyCarAcquisitionCost: 'Anschaffungskosten inkl. USt/NoVA (€)',
    companyCarCo2: 'CO₂-Ausstoß (g/km, WLTP)',
    companyCarRegistrationYear: 'Erstzulassung (Jahr)',
    companyCarHalfBenefit: 'Halber Sachbezug',
    taxFreeAllowance: 'Monatlicher Freibetrag (€)',
    commute: 'Pendlerpauschale',
    commuteBlockedByCompanyCar:
      'Bei Firmenauto für den Arbeitsweg entfällt die Pendlerpauschale (kein Pendlerabzug).',
    commuteHint:
      'Der Pendlerrechner des BMF hilft bei Entfernung und Zumutbarkeit öffentlicher Verkehrsmittel:',
    commuteKm: 'Einfache Wegstrecke (km)',
    commuteDays: 'Pendeltage pro Monat',
    commuteDaysLess4: 'Weniger als 4 Tage',
    commuteDays4to7: '4–7 Tage',
    commuteDays8to10: '8–10 Tage',
    commuteDaysMore10: 'Mehr als 10 Tage',
    publicTransportReasonable: 'Öffentliche Verkehrsmittel zumutbar',
    results: 'Ergebnis',
    recurring: 'Laufend',
    thirteenth: '13. Bezug',
    fourteenth: '14. Bezug',
    annual: 'Jahresgesamt',
    gross: 'Brutto',
    socialInsurance: 'Sozialversicherung',
    incomeTax: 'Lohnsteuer',
    net: 'Netto',
    tableYear: 'Tabellenjahr',
    exportPdf: 'PDF exportieren',
    exportPdfProHint: 'PDF-Export ist eine Pro-Funktion.',
    attemptsRemaining: 'Gratis-Versuche',
    proBadge: 'Pro',
    paymentRequired: 'Gratis-Versuche aufgebraucht',
    paymentRequiredHint: 'Upgrade auf Pro für unbegrenzte Berechnungen.',
    upgradeToPro: 'Jetzt upgraden',
    paymentModalTitle: 'Pro freischalten',
    paymentModalSubtitle: 'Unbegrenzte Berechnungen mit monatlichem Abo.',
    payWithStripe: 'Mit Karte bezahlen (Stripe)',
    payWithPaypal: 'Mit PayPal bezahlen',
    planMonthlyTitle: 'Monatlich',
    planMonthlyPrice: '3,00 €/Monat',
    planMonthlyBenefit: 'Maximale Flexibilität – jederzeit kündbar',
    planSemiannualTitle: '6 Monate',
    planSemiannualPrice: '15,00 € alle 6 Monate',
    planSemiannualPerMonth: 'entspricht 2,50 €/Monat',
    planSemiannualBadge: 'Spare 17 %',
    planSemiannualBenefit: 'Deckt die gesamte Steuersaison ab',
    planAnnualTitle: 'Jährlich',
    planAnnualPrice: '25,00 € pro Jahr',
    planAnnualPerMonth: 'entspricht 2,08 €/Monat',
    planAnnualBadge: 'Bestes Angebot · Spare 31 %',
    planAnnualBenefit: 'Der günstigste Preis – das ganze Jahr sorgenfrei',
    planSelectHeading: 'Abo-Laufzeit wählen',
    paymentMethodHeading: 'Zahlungsmethode wählen',
    payMethodCardTitle: 'Kredit-/Debitkarte',
    payMethodCardDesc: 'Visa, Mastercard & mehr über Stripe',
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'Mit deinem PayPal-Konto bezahlen',
    cancel: 'Abbrechen',
    close: 'Schließen',
    loading: 'Laden…',
    errorGeneric: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
    paymentSuccessTitle: 'Zahlung erfolgreich',
    paymentSuccessBody: 'Ihr Pro-Abo wurde aktiviert. Sie können jetzt unbegrenzt rechnen.',
    paymentCancelTitle: 'Zahlung abgebrochen',
    paymentCancelBody: 'Die Zahlung wurde nicht abgeschlossen.',
    backToCalculator: 'Zurück zum Rechner',
    refreshStatus: 'Status aktualisieren',
    language: 'Sprache',
    faqTitle: 'Häufige Fragen zum Nettogehalt in Österreich',
    faqQ1: 'Wie berechne ich mein Nettogehalt in Österreich?',
    faqA1:
      'Mit ÖstiTax gibst du dein Bruttogehalt ein, wählst Bundesland und Absetzbeträge. Der Rechner zeigt Lohnsteuer, Sozialversicherung und Netto — inklusive 13. und 14. Gehalt.',
    faqQ2: 'Berücksichtigt ÖstiTax den Familienbonus Plus und die Pendlerpauschale?',
    faqA2:
      'Ja. Du kannst Alleinverdienerabsetzbetrag, Familienbonus Plus und Pendlerpauschale angeben. Die Berechnung folgt den aktuellen Tabellen für Österreich.',
    faqQ3: 'Für welches Jahr gelten die Steuertabellen?',
    faqA3:
      'ÖstiTax verwendet die aktuellen Werte Stand Jänner 2026 (Steuerreform und Sozialversicherung).',
    iAmHint: 'Bestimmt die Sozialversicherungs- und Steuerregeln für deine Berechnung.',
    incomePeriodHint:
      '13. und 14. Gehalt werden automatisch berücksichtigt, unabhängig von deiner Auswahl.',
    stateHint: 'Wien hat einen etwas höheren Sozialversicherungsbeitrag (Wohnbauförderung).',
    soleEarnerHint:
      'Für Alleinverdiener oder Alleinerzieher mit mindestens einem Kind (Familienbeihilfe).',
    familyBonusHint:
      'Steuerbonus pro Kind. "Voller Bonus", wenn nur du ihn beantragst, sonst "Geteilter Bonus".',
    benefitInKindHint:
      'Geldwerte Vorteile wie Diensthandy oder -wohnung, die zusätzlich versteuert werden.',
    taxFreeAllowanceHint: 'Laut Freibetragsbescheid deines Finanzamts, falls vorhanden.',
    states: states({
      wien: 'Wien',
      niederoesterreich: 'Niederösterreich',
      oberoesterreich: 'Oberösterreich',
      burgenland: 'Burgenland',
      salzburg: 'Salzburg',
      steiermark: 'Steiermark',
      kaernten: 'Kärnten',
      tirol: 'Tirol',
      vorarlberg: 'Vorarlberg',
    }),
  },
  en: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Net salary calculator · Austria 2026',
    seoHero: 'Your net salary — clearly calculated',
    seoLead:
      'Gross to net in seconds: income tax, social insurance, 13th/14th salary, family bonus and commute allowance.',
    calculate: 'Calculate now',
    calculating: 'Calculating…',
    iAm: 'I am',
    employmentEmployee: 'Worker / employee',
    employmentApprentice: 'Apprentice',
    employmentPensioner: 'Pensioner',
    employmentComingSoon: 'Coming soon',
    grossAmount: 'Gross salary (€)',
    grossAmountMonthly: 'Monthly gross (€)',
    grossAmountYearly: 'Yearly gross (€)',
    incomePeriod: 'My income',
    monthly: 'Monthly',
    yearly: 'Yearly',
    state: 'Place of work (federal state)',
    deductions: 'Deductions',
    soleEarner: 'Sole earner / single parent deduction',
    yes: 'Yes',
    no: 'No',
    familyBonus: 'Familienbonus Plus',
    familyBonusNone: 'No bonus',
    familyBonusFull: 'Full bonus',
    familyBonusShared: 'Shared bonus',
    childrenUnder18: 'Children under 18',
    childrenOver18: 'Children 18+ (family allowance)',
    benefitInKind: 'Monthly benefit in kind (€)',
    companyCarBenefit: 'Benefit in kind from company car',
    companyCarHint:
      'Company car excludes commuter allowance. Optional: vehicle data for automatic KFZ benefit (BMF).',
    companyCarAcquisitionCost: 'Acquisition cost incl. VAT/NoVA (€)',
    companyCarCo2: 'CO₂ emissions (g/km, WLTP)',
    companyCarRegistrationYear: 'First registration (year)',
    companyCarHalfBenefit: 'Half benefit',
    taxFreeAllowance: 'Monthly tax-free allowance (€)',
    commute: 'Commuter allowance',
    commuteBlockedByCompanyCar:
      'Company car used for commuting excludes the Pendlerpauschale (no commuter deduction).',
    commuteHint:
      'The BMF commuter calculator helps with distance and public transport:',
    commuteKm: 'One-way distance (km)',
    commuteDays: 'Commute days per month',
    commuteDaysLess4: 'Less than 4 days',
    commuteDays4to7: '4–7 days',
    commuteDays8to10: '8–10 days',
    commuteDaysMore10: 'More than 10 days',
    publicTransportReasonable: 'Public transport reasonably available',
    results: 'Results',
    recurring: 'Regular pay',
    thirteenth: '13th salary',
    fourteenth: '14th salary',
    annual: 'Annual total',
    gross: 'Gross',
    socialInsurance: 'Social insurance',
    incomeTax: 'Income tax',
    net: 'Net',
    tableYear: 'Table year',
    exportPdf: 'Export PDF',
    exportPdfProHint: 'PDF export is a Pro feature.',
    attemptsRemaining: 'Free tries left',
    proBadge: 'Pro',
    paymentRequired: 'Free tries used up',
    paymentRequiredHint: 'Upgrade to Pro for unlimited calculations.',
    upgradeToPro: 'Upgrade now',
    paymentModalTitle: 'Unlock Pro',
    paymentModalSubtitle: 'Unlimited calculations with a monthly subscription.',
    payWithStripe: 'Pay with card (Stripe)',
    payWithPaypal: 'Pay with PayPal',
    planMonthlyTitle: 'Monthly',
    planMonthlyPrice: '€3.00/month',
    planMonthlyBenefit: 'Maximum flexibility – cancel anytime',
    planSemiannualTitle: '6 months',
    planSemiannualPrice: '€15.00 every 6 months',
    planSemiannualPerMonth: 'equals €2.50/month',
    planSemiannualBadge: 'Save 17%',
    planSemiannualBenefit: 'Covers the entire tax season',
    planAnnualTitle: 'Annual',
    planAnnualPrice: '€25.00 per year',
    planAnnualPerMonth: 'equals €2.08/month',
    planAnnualBadge: 'Best value · Save 31%',
    planAnnualBenefit: 'The lowest price – worry-free all year',
    planSelectHeading: 'Choose your subscription length',
    paymentMethodHeading: 'Choose your payment method',
    payMethodCardTitle: 'Credit / debit card',
    payMethodCardDesc: 'Visa, Mastercard & more via Stripe',
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'Pay with your PayPal account',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading…',
    errorGeneric: 'Something went wrong. Please try again.',
    paymentSuccessTitle: 'Payment successful',
    paymentSuccessBody: 'Your Pro subscription is active. You can calculate without limits.',
    paymentCancelTitle: 'Payment cancelled',
    paymentCancelBody: 'The payment was not completed.',
    backToCalculator: 'Back to calculator',
    refreshStatus: 'Refresh status',
    language: 'Language',
    faqTitle: 'FAQ — net salary in Austria',
    faqQ1: 'How do I calculate my net salary in Austria?',
    faqA1:
      'With ÖstiTax enter your gross salary, choose your federal state and deductions. You get income tax, social insurance and net — including 13th and 14th salary.',
    faqQ2: 'Does ÖstiTax include Familienbonus Plus and commute allowance?',
    faqA2:
      'Yes. You can set sole-earner deduction, Familienbonus Plus and Pendlerpauschale using current Austrian tables.',
    faqQ3: 'Which tax year do the tables use?',
    faqA3: 'ÖstiTax uses the current values as of January 2026.',
    iAmHint: 'Determines the social insurance and tax rules used for your calculation.',
    incomePeriodHint:
      '13th and 14th salary are always included automatically, regardless of your choice here.',
    stateHint: 'Vienna has a slightly higher social insurance rate (housing levy).',
    soleEarnerHint: 'For sole earners or single parents with at least one child (family allowance).',
    familyBonusHint: 'Tax credit per child. "Full bonus" if only you claim it, otherwise "Shared bonus".',
    benefitInKindHint: 'Non-cash perks like a company phone or flat, taxed as extra income.',
    taxFreeAllowanceHint: "From your tax office's Freibetragsbescheid, if you have one.",
    states: states({
      wien: 'Vienna',
      niederoesterreich: 'Lower Austria',
      oberoesterreich: 'Upper Austria',
      burgenland: 'Burgenland',
      salzburg: 'Salzburg',
      steiermark: 'Styria',
      kaernten: 'Carinthia',
      tirol: 'Tyrol',
      vorarlberg: 'Vorarlberg',
    }),
  },
  es: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Calcula tu neto · Austria 2026',
    seoHero: 'Tu salario neto — claro y preciso',
    seoLead:
      'De bruto a neto en segundos: impuesto, seguro social, 13.º/14.º, bonus familiar y desplazamiento.',
    calculate: 'Calcular ahora',
    calculating: 'Calculando…',
    iAm: 'Yo soy',
    employmentEmployee: 'Trabajador(a) / Empleado(a)',
    employmentApprentice: 'Aprendiz',
    employmentPensioner: 'Pensionista',
    employmentComingSoon: 'Próximamente',
    grossAmount: 'Salario bruto (€)',
    grossAmountMonthly: 'Bruto mensual (€)',
    grossAmountYearly: 'Bruto anual (€)',
    incomePeriod: 'Mis ingresos',
    monthly: 'Mensual',
    yearly: 'Anual',
    state: 'Lugar de empleo',
    deductions: 'Deducciones',
    soleEarner: 'Deducción único sustento / monoparental',
    yes: 'Sí',
    no: 'No',
    familyBonus: 'Bono familiar (Familienbonus Plus)',
    familyBonusNone: 'Sin bonificación',
    familyBonusFull: 'Bonus completo',
    familyBonusShared: 'Bonus compartido',
    childrenUnder18: 'Hijos menores de 18',
    childrenOver18: 'Hijos 18+ (subsidio familiar)',
    benefitInKind: 'Subsidio mensual en especie (€)',
    companyCarBenefit: 'Beneficio en especie por automóvil',
    companyCarHint:
      'Con coche de empresa no hay Pendlerpauschale. Opcional: datos del vehículo para calcular el Sachbezug KFZ (BMF).',
    companyCarAcquisitionCost: 'Coste de adquisición incl. IVA/NoVA (€)',
    companyCarCo2: 'Emisiones CO₂ (g/km, WLTP)',
    companyCarRegistrationYear: 'Primera matriculación (año)',
    companyCarHalfBenefit: 'Beneficio a medias',
    taxFreeAllowance: 'Asignación mensual libre de impuestos (€)',
    commute: 'Subsidio por desplazamiento',
    commuteBlockedByCompanyCar:
      'Con coche de empresa para ir al trabajo no hay derecho a Pendlerpauschale.',
    commuteHint:
      'La calculadora de viajeros del BMF ayuda con la distancia y el transporte público:',
    commuteKm: 'Ruta de ida en km',
    commuteDays: 'Días de desplazamiento al mes',
    commuteDaysLess4: 'Menos de 4 días',
    commuteDays4to7: '4–7 días',
    commuteDays8to10: '8–10 días',
    commuteDaysMore10: 'Más de 10 días',
    publicTransportReasonable: 'Es razonable el transporte público',
    results: 'Resultados',
    recurring: 'Pago habitual',
    thirteenth: '13.º sueldo',
    fourteenth: '14.º sueldo',
    annual: 'Total anual',
    gross: 'Bruto',
    socialInsurance: 'Seguro social',
    incomeTax: 'Impuesto sobre la renta',
    net: 'Neto',
    tableYear: 'Año de tablas',
    exportPdf: 'Exportar PDF',
    exportPdfProHint: 'La exportación PDF es una función Pro.',
    attemptsRemaining: 'Intentos gratis',
    proBadge: 'Pro',
    paymentRequired: 'Sin intentos gratis',
    paymentRequiredHint: 'Pasa a Pro para cálculos ilimitados.',
    upgradeToPro: 'Mejorar plan',
    paymentModalTitle: 'Desbloquear Pro',
    paymentModalSubtitle: 'Cálculos ilimitados con suscripción mensual.',
    payWithStripe: 'Pagar con tarjeta (Stripe)',
    payWithPaypal: 'Pagar con PayPal',
    planMonthlyTitle: 'Mensual',
    planMonthlyPrice: '3,00 €/mes',
    planMonthlyBenefit: 'Máxima flexibilidad, cancela cuando quieras',
    planSemiannualTitle: '6 meses',
    planSemiannualPrice: '15,00 € cada 6 meses',
    planSemiannualPerMonth: 'equivale a 2,50 €/mes',
    planSemiannualBadge: 'Ahorra 17%',
    planSemiannualBenefit: 'Cubre toda la temporada de la declaración',
    planAnnualTitle: 'Anual',
    planAnnualPrice: '25,00 € al año',
    planAnnualPerMonth: 'equivale a 2,08 €/mes',
    planAnnualBadge: 'Mejor precio · Ahorra 31%',
    planAnnualBenefit: 'El precio más bajo, todo el año sin preocupaciones',
    planSelectHeading: 'Elige la duración de tu suscripción',
    paymentMethodHeading: 'Elige tu método de pago',
    payMethodCardTitle: 'Tarjeta de crédito/débito',
    payMethodCardDesc: 'Visa, Mastercard y más vía Stripe',
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'Paga con tu cuenta de PayPal',
    cancel: 'Cancelar',
    close: 'Cerrar',
    loading: 'Cargando…',
    errorGeneric: 'Ha ocurrido un error. Inténtalo de nuevo.',
    paymentSuccessTitle: 'Pago correcto',
    paymentSuccessBody: 'Tu suscripción Pro está activa.',
    paymentCancelTitle: 'Pago cancelado',
    paymentCancelBody: 'No se completó el pago.',
    backToCalculator: 'Volver a la calculadora',
    refreshStatus: 'Actualizar estado',
    language: 'Idioma',
    faqTitle: 'Preguntas frecuentes — salario neto en Austria',
    faqQ1: '¿Cómo calculo mi salario neto en Austria?',
    faqA1:
      'Con ÖstiTax introduces el bruto, eliges el estado federal y las deducciones. Verás impuesto, seguro social y neto — incluido el 13.º y 14.º.',
    faqQ2: '¿Incluye Familienbonus Plus y la indemnización por desplazamiento?',
    faqA2:
      'Sí. Puedes indicar deducción de único sustento, Familienbonus Plus y Pendlerpauschale según tablas austriacas vigentes.',
    faqQ3: '¿De qué año son las tablas fiscales?',
    faqA3: 'ÖstiTax usa los valores vigentes a enero de 2026.',
    iAmHint: 'Determina las reglas de seguridad social e impuestos usadas en tu cálculo.',
    incomePeriodHint:
      'El 13.º y 14.º sueldo se calculan siempre automáticamente, sin importar tu elección aquí.',
    stateHint: 'Viena tiene una cotización a la seguridad social algo más alta (fomento de vivienda).',
    soleEarnerHint:
      'Para quien es el único sostén del hogar o monoparental con al menos un hijo (con asignación familiar).',
    familyBonusHint:
      'Bono fiscal por hijo. "Bono completo" si solo tú lo solicitas, si no "Bono compartido".',
    benefitInKindHint:
      'Beneficios en especie como móvil o vivienda de empresa, gravados como ingreso extra.',
    taxFreeAllowanceHint: 'Según la resolución de exención de tu oficina de impuestos, si la tienes.',
    states: states({
      wien: 'Viena',
      niederoesterreich: 'Baja Austria',
      oberoesterreich: 'Alta Austria',
      burgenland: 'Burgenland',
      salzburg: 'Salzburgo',
      steiermark: 'Estiria',
      kaernten: 'Carintia',
      tirol: 'Tirol',
      vorarlberg: 'Vorarlberg',
    }),
  },
  tr: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Net maaş hesapla · Avusturya 2026',
    seoHero: 'Net maaşın — net ve anlaşılır',
    seoLead:
      'Brütten nete saniyeler içinde: gelir vergisi, sosyal sigorta, 13./14. maaş ve indirimler.',
    calculate: 'Şimdi hesapla',
    calculating: 'Hesaplanıyor…',
    iAm: 'Ben',
    employmentEmployee: 'İşçi / Memur',
    employmentApprentice: 'Çırak',
    employmentPensioner: 'Emekli',
    employmentComingSoon: 'Yakında',
    grossAmount: 'Brüt maaş (€)',
    grossAmountMonthly: 'Aylık brüt (€)',
    grossAmountYearly: 'Yıllık brüt (€)',
    incomePeriod: 'Gelirim',
    monthly: 'Aylık',
    yearly: 'Yıllık',
    state: 'İş yeri (eyalet)',
    deductions: 'İndirimler',
    soleEarner: 'Tek gelirli / bekar ebeveyn indirimi',
    yes: 'Evet',
    no: 'Hayır',
    familyBonus: 'Familienbonus Plus',
    familyBonusNone: 'Bonus yok',
    familyBonusFull: 'Tam bonus',
    familyBonusShared: 'Paylaşımlı bonus',
    childrenUnder18: '18 yaş altı çocuk',
    childrenOver18: '18+ çocuk (aile yardımı)',
    benefitInKind: 'Aylık ayni menfaat (€)',
    companyCarBenefit: 'Şirket arabası ayni menfaati',
    companyCarHint:
      'Şirket arabasında Pendlerpauschale yok. İsteğe bağlı: BMF KFZ menfaati için araç bilgileri.',
    companyCarAcquisitionCost: 'Edinme maliyeti KDV/NoVA dahil (€)',
    companyCarCo2: 'CO₂ emisyonu (g/km, WLTP)',
    companyCarRegistrationYear: 'İlk tescil (yıl)',
    companyCarHalfBenefit: 'Yarım menfaat',
    taxFreeAllowance: 'Aylık vergi muafiyeti (€)',
    commute: 'Yol parası',
    commuteBlockedByCompanyCar:
      'İşe gidiş için şirket arabası varsa Pendlerpauschale uygulanmaz.',
    commuteHint:
      'BMF yol hesabı mesafe ve toplu taşıma için yardımcı olur:',
    commuteKm: 'Tek yön mesafe (km)',
    commuteDays: 'Aylık yol günü',
    commuteDaysLess4: '4 günden az',
    commuteDays4to7: '4–7 gün',
    commuteDays8to10: '8–10 gün',
    commuteDaysMore10: '10 günden fazla',
    publicTransportReasonable: 'Toplu taşıma uygun',
    results: 'Sonuçlar',
    recurring: 'Düzenli maaş',
    thirteenth: '13. maaş',
    fourteenth: '14. maaş',
    annual: 'Yıllık toplam',
    gross: 'Brüt',
    socialInsurance: 'Sosyal sigorta',
    incomeTax: 'Gelir vergisi',
    net: 'Net',
    tableYear: 'Tablo yılı',
    exportPdf: 'PDF indir',
    exportPdfProHint: 'PDF dışa aktarma Pro özelliğidir.',
    attemptsRemaining: 'Ücretsiz deneme',
    proBadge: 'Pro',
    paymentRequired: 'Ücretsiz denemeler bitti',
    paymentRequiredHint: 'Sınırsız hesap için Pro’ya geçin.',
    upgradeToPro: 'Pro’ya yükselt',
    paymentModalTitle: 'Pro’yu aç',
    paymentModalSubtitle: 'Aylık abonelikle sınırsız hesaplama.',
    payWithStripe: 'Kartla öde (Stripe)',
    payWithPaypal: 'PayPal ile öde',
    planMonthlyTitle: 'Aylık',
    planMonthlyPrice: '3,00 €/ay',
    planMonthlyBenefit: 'Maksimum esneklik, istediğin zaman iptal et',
    planSemiannualTitle: '6 ay',
    planSemiannualPrice: 'Her 6 ayda 15,00 €',
    planSemiannualPerMonth: 'aylık 2,50 €’ya denk gelir',
    planSemiannualBadge: '%17 tasarruf',
    planSemiannualBenefit: 'Tüm vergi sezonunu kapsar',
    planAnnualTitle: 'Yıllık',
    planAnnualPrice: 'Yılda 25,00 €',
    planAnnualPerMonth: 'aylık 2,08 €’ya denk gelir',
    planAnnualBadge: 'En iyi fiyat · %31 tasarruf',
    planAnnualBenefit: 'En düşük fiyat, tüm yıl sorunsuz',
    planSelectHeading: 'Abonelik süresini seç',
    paymentMethodHeading: 'Ödeme yönteminizi seçin',
    payMethodCardTitle: 'Kredi/banka kartı',
    payMethodCardDesc: "Stripe üzerinden Visa, Mastercard ve daha fazlası",
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'PayPal hesabınla öde',
    cancel: 'İptal',
    close: 'Kapat',
    loading: 'Yükleniyor…',
    errorGeneric: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    paymentSuccessTitle: 'Ödeme başarılı',
    paymentSuccessBody: 'Pro aboneliğiniz aktif.',
    paymentCancelTitle: 'Ödeme iptal edildi',
    paymentCancelBody: 'Ödeme tamamlanmadı.',
    backToCalculator: 'Hesaplayıcıya dön',
    refreshStatus: 'Durumu yenile',
    language: 'Dil',
    faqTitle: 'SSS — Avusturya net maaş',
    faqQ1: 'Avusturya’da net maaşımı nasıl hesaplarım?',
    faqA1:
      'ÖstiTax ile brüt maaşı gir, eyaleti ve indirimleri seç. Gelir vergisi, sosyal sigorta ve net — 13./14. maaş dahil — görünür.',
    faqQ2: 'Familienbonus Plus ve yol parası dahil mi?',
    faqA2:
      'Evet. Tek gelirli indirimi, Familienbonus Plus ve Pendlerpauschale girebilirsin.',
    faqQ3: 'Vergi tabloları hangi yıla ait?',
    faqA3: 'ÖstiTax Ocak 2026 değerlerini kullanır.',
    iAmHint: 'Hesaplamanda kullanılan sosyal sigorta ve vergi kurallarını belirler.',
    incomePeriodHint:
      '13. ve 14. maaş, buradaki seçimden bağımsız olarak her zaman otomatik hesaplanır.',
    stateHint: 'Viyana\'da sosyal sigorta oranı biraz daha yüksektir (konut katkısı).',
    soleEarnerHint: 'En az bir çocuğu olan (aile yardımı alan) tek kazananlar veya tek ebeveynler için.',
    familyBonusHint:
      'Çocuk başına vergi indirimi. Sadece sen başvurursan "Tam bonus", değilse "Paylaşımlı bonus".',
    benefitInKindHint:
      'Şirket telefonu veya lojmanı gibi, ek gelir olarak vergilendirilen ayni menfaatler.',
    taxFreeAllowanceHint: 'Vergi dairenin Freibetragsbescheid kararına göre, varsa.',
    states: states({
      wien: 'Viyana',
      niederoesterreich: 'Aşağı Avusturya',
      oberoesterreich: 'Yukarı Avusturya',
      burgenland: 'Burgenland',
      salzburg: 'Salzburg',
      steiermark: 'Steiermark',
      kaernten: 'Kärnten',
      tirol: 'Tirol',
      vorarlberg: 'Vorarlberg',
    }),
  },
  bcs: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Izračunaj neto · Austrija 2026',
    seoHero: 'Tvoja neto plata — jasno izračunata',
    seoLead:
      'Od bruto do neto u sekundama: porez, socijalno, 13./14. plata i odbici.',
    calculate: 'Izračunaj sada',
    calculating: 'Računanje…',
    iAm: 'Ja sam',
    employmentEmployee: 'Radnik / zaposleni',
    employmentApprentice: 'Pripravnik',
    employmentPensioner: 'Penzioner',
    employmentComingSoon: 'Uskoro',
    grossAmount: 'Bruto plata (€)',
    grossAmountMonthly: 'Mjesečni bruto (€)',
    grossAmountYearly: 'Godišnji bruto (€)',
    incomePeriod: 'Moja primanja',
    monthly: 'Mjesečno',
    yearly: 'Godišnje',
    state: 'Mjesto rada (savezna država)',
    deductions: 'Odbici',
    soleEarner: 'Odbitak za jednog zaradnja / samohranog roditelja',
    yes: 'Da',
    no: 'Ne',
    familyBonus: 'Familienbonus Plus',
    familyBonusNone: 'Bez bonusa',
    familyBonusFull: 'Puni bonus',
    familyBonusShared: 'Podijeljeni bonus',
    childrenUnder18: 'Djeca do 18 godina',
    childrenOver18: 'Djeca 18+ (porodična naknada)',
    benefitInKind: 'Mjesečna naknada u naturi (€)',
    companyCarBenefit: 'Naknada zbog službenog auta',
    companyCarHint:
      'Službeni auto isključuje Pendlerpauschale. Opcionalno: podaci vozila za KFZ naknadu (BMF).',
    companyCarAcquisitionCost: 'Nabavna cijena s PDV/NoVA (€)',
    companyCarCo2: 'CO₂ emisije (g/km, WLTP)',
    companyCarRegistrationYear: 'Prva registracija (godina)',
    companyCarHalfBenefit: 'Polovina naknade',
    taxFreeAllowance: 'Mjesečni neoporezivi iznos (€)',
    commute: 'Putni trošak',
    commuteBlockedByCompanyCar:
      'Službeni auto za posao isključuje Pendlerpauschale.',
    commuteHint:
      'BMF kalkulator putovanja pomaže oko udaljenosti i javnog prevoza:',
    commuteKm: 'Udaljenost u jednom smjeru (km)',
    commuteDays: 'Dana putovanja mjesečno',
    commuteDaysLess4: 'Manje od 4 dana',
    commuteDays4to7: '4–7 dana',
    commuteDays8to10: '8–10 dana',
    commuteDaysMore10: 'Više od 10 dana',
    publicTransportReasonable: 'Javni prevoz dostupan',
    results: 'Rezultati',
    recurring: 'Redovna plata',
    thirteenth: '13. plata',
    fourteenth: '14. plata',
    annual: 'Godišnji ukupno',
    gross: 'Bruto',
    socialInsurance: 'Socijalno osiguranje',
    incomeTax: 'Porez na dohodak',
    net: 'Neto',
    tableYear: 'Godina tabele',
    exportPdf: 'Izvezi PDF',
    exportPdfProHint: 'Izvoz PDF-a je Pro funkcija.',
    attemptsRemaining: 'Besplatni pokušaji',
    proBadge: 'Pro',
    paymentRequired: 'Besplatni pokušaji iskorišteni',
    paymentRequiredHint: 'Nadogradite na Pro za neograničene izračune.',
    upgradeToPro: 'Nadogradi',
    paymentModalTitle: 'Otključaj Pro',
    paymentModalSubtitle: 'Neograničeni izračuni uz mjesečnu pretplatu.',
    payWithStripe: 'Plati karticom (Stripe)',
    payWithPaypal: 'Plati PayPal-om',
    planMonthlyTitle: 'Mjesečno',
    planMonthlyPrice: '3,00 €/mjesec',
    planMonthlyBenefit: 'Maksimalna fleksibilnost, otkaži kad god želiš',
    planSemiannualTitle: '6 mjeseci',
    planSemiannualPrice: '15,00 € svakih 6 mjeseci',
    planSemiannualPerMonth: 'odgovara 2,50 €/mjesec',
    planSemiannualBadge: 'Ušteda 17%',
    planSemiannualBenefit: 'Pokriva cijelu poresku sezonu',
    planAnnualTitle: 'Godišnje',
    planAnnualPrice: '25,00 € godišnje',
    planAnnualPerMonth: 'odgovara 2,08 €/mjesec',
    planAnnualBadge: 'Najbolja ponuda · Ušteda 31%',
    planAnnualBenefit: 'Najniža cijena, cijela godina bez brige',
    planSelectHeading: 'Odaberi trajanje pretplate',
    paymentMethodHeading: 'Odaberi način plaćanja',
    payMethodCardTitle: 'Kreditna/debitna kartica',
    payMethodCardDesc: 'Visa, Mastercard i drugi putem Stripea',
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'Plati svojim PayPal računom',
    cancel: 'Otkaži',
    close: 'Zatvori',
    loading: 'Učitavanje…',
    errorGeneric: 'Došlo je do greške. Pokušajte ponovo.',
    paymentSuccessTitle: 'Uplata uspješna',
    paymentSuccessBody: 'Vaša Pro pretplata je aktivna.',
    paymentCancelTitle: 'Uplata otkazana',
    paymentCancelBody: 'Uplata nije završena.',
    backToCalculator: 'Nazad na kalkulator',
    refreshStatus: 'Osvježi status',
    language: 'Jezik',
    faqTitle: 'Česta pitanja — neto plata u Austriji',
    faqQ1: 'Kako izračunati neto platu u Austriji?',
    faqA1:
      'U ÖstiTax unesi bruto, saveznu državu i odbitke. Dobijaš porez, socijalno i neto — uključujući 13. i 14. platu.',
    faqQ2: 'Uključuje li Familienbonus Plus i putne troškove?',
    faqA2:
      'Da. Možeš unijeti odbitak za jednog zaradnja, Familienbonus Plus i Pendlerpauschale.',
    faqQ3: 'Za koju godinu važe poreske tabele?',
    faqA3: 'ÖstiTax koristi vrijednosti od januara 2026.',
    iAmHint: 'Određuje pravila socijalnog osiguranja i poreza za tvoj izračun.',
    incomePeriodHint:
      '13. i 14. plata se uvijek automatski uračunavaju, bez obzira na tvoj izbor ovdje.',
    stateHint: 'Beč ima nešto viši doprinos za socijalno osiguranje (stambeni doprinos).',
    soleEarnerHint:
      'Za jedine zarađivače ili samohrane roditelje sa najmanje jednim djetetom (dječiji dodatak).',
    familyBonusHint:
      'Poreski bonus po djetetu. "Puni bonus" ako ga tražiš samo ti, inače "Podijeljeni bonus".',
    benefitInKindHint:
      'Nenovčane pogodnosti poput službenog telefona ili stana, koje se dodatno oporezuju.',
    taxFreeAllowanceHint: 'Prema rješenju tvoje poreske uprave (Freibetragsbescheid), ako postoji.',
    states: states({
      wien: 'Beč',
      niederoesterreich: 'Donja Austrija',
      oberoesterreich: 'Gornja Austrija',
      burgenland: 'Burgenland',
      salzburg: 'Salzburg',
      steiermark: 'Štajerska',
      kaernten: 'Koroška',
      tirol: 'Tirol',
      vorarlberg: 'Vorarlberg',
    }),
  },
  uk: {
    appTitle: 'ÖstiTax',
    appSubtitle: 'Розрахунок нетто · Австрія 2026',
    seoHero: 'Твоя нетто зарплата — зрозуміло порахована',
    seoLead:
      'Від брутто до нетто за секунди: податок, соцстрахування, 13-та/14-та та відрахування.',
    calculate: 'Обрахувати зараз',
    calculating: 'Обчислення…',
    iAm: 'Я є',
    employmentEmployee: 'Працівник / службовець',
    employmentApprentice: 'Учень',
    employmentPensioner: 'Пенсіонер',
    employmentComingSoon: 'Незабаром',
    grossAmount: 'Брутто зарплата (€)',
    grossAmountMonthly: 'Брутто щомісяця (€)',
    grossAmountYearly: 'Брутто на рік (€)',
    incomePeriod: 'Мої доходи',
    monthly: 'Щомісяця',
    yearly: 'Щорічно',
    state: 'Місце роботи (земля)',
    deductions: 'Відрахування',
    soleEarner: 'Відрахування для одного заробітчика / одинокого батька',
    yes: 'Так',
    no: 'Ні',
    familyBonus: 'Familienbonus Plus',
    familyBonusNone: 'Без бонусу',
    familyBonusFull: 'Повний бонус',
    familyBonusShared: 'Поділений бонус',
    childrenUnder18: 'Діти до 18 років',
    childrenOver18: 'Діти 18+ (сімейна допомога)',
    benefitInKind: 'Щомісячна натуральна вигода (€)',
    companyCarBenefit: 'Вигода від службового авто',
    companyCarHint:
      'Службове авто скасовує Pendlerpauschale. За бажанням: дані авто для KFZ (BMF).',
    companyCarAcquisitionCost: 'Вартість придбання з ПДВ/NoVA (€)',
    companyCarCo2: 'Викиди CO₂ (г/км, WLTP)',
    companyCarRegistrationYear: 'Перша реєстрація (рік)',
    companyCarHalfBenefit: 'Половина вигоди',
    taxFreeAllowance: 'Щомісячна неоподатковувана сума (€)',
    commute: 'Компенсація за дорогу',
    commuteBlockedByCompanyCar:
      'Службове авто для роботи — Pendlerpauschale не застосовується.',
    commuteHint:
      'Калькулятор BMF допомагає з відстанню та громадським транспортом:',
    commuteKm: 'Відстань в один бік (км)',
    commuteDays: 'Днів у дорозі на місяць',
    commuteDaysLess4: 'Менше 4 днів',
    commuteDays4to7: '4–7 днів',
    commuteDays8to10: '8–10 днів',
    commuteDaysMore10: 'Більше 10 днів',
    publicTransportReasonable: 'Громадський транспорт доступний',
    results: 'Результати',
    recurring: 'Регулярна виплата',
    thirteenth: '13-та зарплата',
    fourteenth: '14-та зарплата',
    annual: 'Річний підсумок',
    gross: 'Брутто',
    socialInsurance: 'Соціальне страхування',
    incomeTax: 'Податок на доходи',
    net: 'Нетто',
    tableYear: 'Рік таблиць',
    exportPdf: 'Експорт PDF',
    exportPdfProHint: 'Експорт PDF — функція Pro.',
    attemptsRemaining: 'Безкоштовні спроби',
    proBadge: 'Pro',
    paymentRequired: 'Безкоштовні спроби вичерпано',
    paymentRequiredHint: 'Оформіть Pro для необмежених розрахунків.',
    upgradeToPro: 'Оновити до Pro',
    paymentModalTitle: 'Активувати Pro',
    paymentModalSubtitle: 'Необмежені розрахунки за місячною підпискою.',
    payWithStripe: 'Оплатити карткою (Stripe)',
    payWithPaypal: 'Оплатити PayPal',
    planMonthlyTitle: 'Щомісячно',
    planMonthlyPrice: '3,00 €/міс',
    planMonthlyBenefit: 'Максимальна гнучкість, скасуйте будь-коли',
    planSemiannualTitle: '6 місяців',
    planSemiannualPrice: '15,00 € кожні 6 місяців',
    planSemiannualPerMonth: 'відповідає 2,50 €/міс',
    planSemiannualBadge: 'Економія 17%',
    planSemiannualBenefit: 'Покриває весь податковий сезон',
    planAnnualTitle: 'Щорічно',
    planAnnualPrice: '25,00 € на рік',
    planAnnualPerMonth: 'відповідає 2,08 €/міс',
    planAnnualBadge: 'Найкраща пропозиція · Економія 31%',
    planAnnualBenefit: 'Найнижча ціна, весь рік без турбот',
    planSelectHeading: 'Оберіть термін підписки',
    paymentMethodHeading: 'Оберіть спосіб оплати',
    payMethodCardTitle: 'Кредитна/дебетова картка',
    payMethodCardDesc: 'Visa, Mastercard та інші через Stripe',
    payMethodPaypalTitle: 'PayPal',
    payMethodPaypalDesc: 'Оплатіть за допомогою рахунку PayPal',
    cancel: 'Скасувати',
    close: 'Закрити',
    loading: 'Завантаження…',
    errorGeneric: 'Сталася помилка. Спробуйте ще раз.',
    paymentSuccessTitle: 'Оплату успішно завершено',
    paymentSuccessBody: 'Ваша Pro-підписка активна.',
    paymentCancelTitle: 'Оплату скасовано',
    paymentCancelBody: 'Оплату не завершено.',
    backToCalculator: 'Назад до калькулятора',
    refreshStatus: 'Оновити статус',
    language: 'Мова',
    faqTitle: 'Поширені запитання — нетто в Австрії',
    faqQ1: 'Як порахувати нетто зарплату в Австрії?',
    faqA1:
      'У ÖstiTax введи брутто, землю та відрахування. Побачиш податок, соцстрахування і нетто — включно з 13-ю та 14-ю.',
    faqQ2: 'Чи є Familienbonus Plus і компенсація за дорогу?',
    faqA2:
      'Так. Можна вказати відрахування одного заробітчика, Familienbonus Plus і Pendlerpauschale.',
    faqQ3: 'Якого року таблиці податків?',
    faqA3: 'ÖstiTax використовує значення станом на січень 2026.',
    iAmHint: 'Визначає правила соцстрахування та податку для твого розрахунку.',
    incomePeriodHint:
      '13-та і 14-та зарплата завжди враховуються автоматично, незалежно від вибору тут.',
    stateHint: 'У Відні трохи вищий внесок на соцстрахування (житловий збір).',
    soleEarnerHint:
      'Для єдиного заробітчика або одинокого батька чи матері щонайменше з однією дитиною (сімейна допомога).',
    familyBonusHint:
      '"Повний бонус", якщо оформлюєш лише ти, інакше "Поділений бонус".',
    benefitInKindHint:
      'Негрошові вигоди, як службовий телефон чи житло, що оподатковуються як додатковий дохід.',
    taxFreeAllowanceHint: 'За рішенням про звільнення від податку (Freibetragsbescheid) твоєї податкової, якщо є.',
    states: states({
      wien: 'Відень',
      niederoesterreich: 'Нижня Австрія',
      oberoesterreich: 'Верхня Австрія',
      burgenland: 'Бургенланд',
      salzburg: 'Зальцбург',
      steiermark: 'Штирія',
      kaernten: 'Карінтія',
      tirol: 'Тіроль',
      vorarlberg: 'Форарльберг',
    }),
  },
};

export const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'bcs', label: 'BCS' },
  { code: 'es', label: 'Español' },
  { code: 'uk', label: 'Українська' },
];
