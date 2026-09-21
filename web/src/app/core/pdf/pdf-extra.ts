import type { CalculateRequest } from '../models/api.models';
import type { Lang } from '../i18n/translations';

/**
 * Textos del PDF Basico (gratis) y de las paginas extra del PDF Completo (Pro).
 * Solo de/en/es: son los idiomas que la fuente estandar del PDF puede dibujar.
 *
 * Son informacion general, no asesoramiento fiscal: los "consejos" son avisos de "prueba si te
 * corresponde" derivados de lo que el usuario introdujo. El PDF NO es un formulario oficial ni
 * dice "a pagar / a devolver": la app calcula el sueldo neto, no una declaracion.
 */
export type PdfTier = 'basic' | 'pro';
export type ExtraLang = 'de' | 'en' | 'es';

export interface PdfExtra {
  pageWord: string;
  basicSummary: string;
  basicNetLabel: string;
  basicAnnualNet: string;
  basicInputs: string;
  basicOverview: string;
  upgradeTitle: string;
  upgradeBody: string;
  appliedTitle: string;
  appliedNone: string;
  applied: {
    soleEarner: string;
    familyBonusFull: string;
    familyBonusShared: string;
    children: string;
    commute: string;
    allowance: string;
    benefitInKind: string;
    companyCar: string;
  };
  explainTitle: string;
  explain: { heading: string; text: string }[];
  tipsTitle: string;
  tipsIntro: string;
  tip: {
    familyBonus: string;
    soleEarner: string;
    commute: string;
    allowance: string;
    receipts: string;
    veranlagung: string;
  };
  guideTitle: string;
  guide: string[];
  guideNote: string;
}

const DE: PdfExtra = {
  pageWord: 'Seite',
  basicSummary: 'Zusammenfassung',
  basicNetLabel: 'Nettobezug (laufend)',
  basicAnnualNet: 'Nettobezug (Jahresbezug)',
  basicInputs: 'Grunddaten',
  basicOverview: 'Überblick',
  upgradeTitle: 'Auf Pro upgraden',
  upgradeBody:
    'Für die vollständige Aufschlüsselung, ausführliche Erklärungen und den Leitfaden zur Einreichung.',
  appliedTitle: 'Berücksichtigte Angaben',
  appliedNone: 'Keine besonderen Absetzbeträge oder Freibeträge angegeben.',
  applied: {
    soleEarner: 'Alleinverdiener-/Alleinerzieherabsetzbetrag berücksichtigt',
    familyBonusFull: 'Familienbonus Plus: voller Bonus',
    familyBonusShared: 'Familienbonus Plus: geteilter Bonus',
    children: 'Kinder unter 18: {u18}, über 18 mit Familienbeihilfe: {o18}',
    commute: 'Pendlerpauschale: {km} km einfache Wegstrecke',
    allowance: 'Monatlicher Freibetrag: {amount}',
    benefitInKind: 'Sachbezug (monatlich): {amount}',
    companyCar: 'Firmenauto (Sachbezug KFZ) berücksichtigt',
  },
  explainTitle: 'Erläuterungen zu den Positionen',
  explain: [
    {
      heading: 'Bruttobezug',
      text: 'Der Bruttobezug ist Ihr Arbeitsentgelt vor Abzügen. Das Ergebnis geht von 14 gleich hohen Bezügen aus: zwölf laufende Monatsbezüge sowie das 13. und 14. Gehalt (Urlaubs- und Weihnachtsgeld).',
    },
    {
      heading: 'Sozialversicherung',
      text: 'Die Sozialversicherung umfasst unter anderem Kranken-, Pensions- und Arbeitslosenversicherung. Sie wird bis zur jeweiligen Höchstbeitragsgrundlage berechnet und mindert die Bemessungsgrundlage der Lohnsteuer.',
    },
    {
      heading: 'Lohnsteuer',
      text: 'Die Lohnsteuer wird nach dem progressiven Einkommensteuertarif berechnet. Absetzbeträge verringern die errechnete Steuer direkt, Freibeträge verringern die Bemessungsgrundlage.',
    },
    {
      heading: '13. und 14. Gehalt',
      text: 'Das 13. und 14. Gehalt sind sonstige Bezüge und werden im Rahmen des Jahressechstels begünstigt besteuert. Die Sozialversicherung fällt weiterhin an.',
    },
    {
      heading: 'Familienbonus Plus',
      text: 'Der Familienbonus Plus ist ein Absetzbetrag pro Kind und verringert die Lohnsteuer direkt. Er kann von einer Person voll oder von zwei Personen geteilt beansprucht werden.',
    },
    {
      heading: 'Pendlerpauschale',
      text: 'Die Pendlerpauschale berücksichtigt den Arbeitsweg. Ob das kleine oder das große Pendlerpauschale gilt, hängt von Entfernung und Zumutbarkeit der öffentlichen Verkehrsmittel ab. Der Pendlereuro kommt als Absetzbetrag hinzu.',
    },
  ],
  tipsTitle: 'Hinweise zur Optimierung',
  tipsIntro:
    'Allgemeine Hinweise auf Basis Ihrer Angaben. Bitte prüfen Sie selbst, ob sie auf Sie zutreffen.',
  tip: {
    familyBonus:
      'Sie haben Kinder angegeben, aber keinen Familienbonus Plus gewählt. Prüfen Sie, ob Sie ihn (voll oder geteilt) beanspruchen können.',
    soleEarner:
      'Sie haben Kinder angegeben. Prüfen Sie, ob der Alleinverdiener- oder Alleinerzieherabsetzbetrag für Sie in Frage kommt.',
    commute:
      'Sie haben keine Pendelstrecke angegeben. Wenn Sie zur Arbeit pendeln, kann die Pendlerpauschale die Steuer senken; der Pendlerrechner des BMF hilft bei der Prüfung.',
    allowance:
      'Ein Freibetragsbescheid (z. B. für Werbungskosten oder Sonderausgaben) kann die laufende Lohnsteuer schon während des Jahres senken.',
    receipts:
      'Sammeln Sie Belege für Werbungskosten wie Arbeitsmittel, Fortbildung oder Reisekosten: Sie können in der Arbeitnehmerveranlagung geltend gemacht werden.',
    veranlagung:
      'Die Arbeitnehmerveranlagung kann rückwirkend für bis zu fünf Jahre beantragt werden.',
  },
  guideTitle: 'Leitfaden zur Einreichung (Arbeitnehmerveranlagung)',
  guide: [
    'Zugang zu FinanzOnline einrichten (z. B. mit ID Austria).',
    'Unter „Formulare“ die Erklärung zur Arbeitnehmerveranlagung (Formular L1) öffnen.',
    'Kinder und Familienbonus Plus über die Beilage L1k angeben, Alleinverdiener-/Alleinerzieherabsetzbetrag über die Beilage L1ab.',
    'Werbungskosten, Sonderausgaben und außergewöhnliche Belastungen samt Belegen erfassen; die Pendlerpauschale mit dem Pendlerrechner des BMF prüfen.',
    'Erklärung absenden, den Bescheid abwarten und die Belege aufbewahren.',
  ],
  guideNote:
    'Angaben ohne Gewähr; Bezeichnungen der Formulare können sich ändern. Maßgeblich sind die offiziellen Formulare und Hinweise des BMF (bmf.gv.at). Dieses Dokument ist weder eine Steuererklärung noch ersetzt es eine Steuerberatung.',
};

const EN: PdfExtra = {
  pageWord: 'Page',
  basicSummary: 'Summary',
  basicNetLabel: 'Net pay (regular)',
  basicAnnualNet: 'Net pay (annual)',
  basicInputs: 'Basic details',
  basicOverview: 'Overview',
  upgradeTitle: 'Upgrade to Pro',
  upgradeBody:
    'For the full breakdown, detailed explanations and the filing guide.',
  appliedTitle: 'Details taken into account',
  appliedNone: 'No special tax credits or allowances entered.',
  applied: {
    soleEarner: 'Sole earner / single parent tax credit applied',
    familyBonusFull: 'Family Bonus Plus: full bonus',
    familyBonusShared: 'Family Bonus Plus: shared bonus',
    children: 'Children under 18: {u18}, over 18 with family allowance: {o18}',
    commute: 'Commuter allowance: {km} km one way',
    allowance: 'Monthly tax-free allowance: {amount}',
    benefitInKind: 'Benefit in kind (monthly): {amount}',
    companyCar: 'Company car (benefit in kind) taken into account',
  },
  explainTitle: 'Explanation of the items',
  explain: [
    {
      heading: 'Gross pay',
      text: 'Gross pay is your salary before deductions. The result assumes 14 equal payments: twelve regular monthly payments plus the 13th and 14th salary (holiday and Christmas pay).',
    },
    {
      heading: 'Social insurance',
      text: 'Social insurance covers health, pension and unemployment insurance, among others. It is calculated up to the applicable maximum contribution base and reduces the basis for income tax withholding.',
    },
    {
      heading: 'Income tax (Lohnsteuer)',
      text: 'Income tax is calculated using the progressive income tax scale. Tax credits reduce the calculated tax directly; allowances reduce the tax base.',
    },
    {
      heading: '13th and 14th salary',
      text: 'The 13th and 14th salary are special payments taxed at a favourable rate within the annual one-sixth limit (Jahressechstel). Social insurance still applies.',
    },
    {
      heading: 'Family Bonus Plus',
      text: 'The Family Bonus Plus is a tax credit per child and reduces income tax directly. It can be claimed in full by one person or shared between two.',
    },
    {
      heading: 'Commuter allowance',
      text: 'The commuter allowance takes the way to work into account. Whether the small or large allowance applies depends on the distance and on whether public transport is reasonable. The commuter euro is added as a tax credit.',
    },
  ],
  tipsTitle: 'Optimisation hints',
  tipsIntro:
    'General hints based on your entries. Please check yourself whether they apply to you.',
  tip: {
    familyBonus:
      'You entered children but chose no Family Bonus Plus. Check whether you can claim it (in full or shared).',
    soleEarner:
      'You entered children. Check whether the sole earner or single parent tax credit applies to you.',
    commute:
      'You entered no commute distance. If you commute to work, the commuter allowance can lower your tax; the BMF commuter calculator helps you check.',
    allowance:
      'An allowance notice (Freibetragsbescheid, for example for work-related expenses or special expenses) can reduce your income tax withholding during the year.',
    receipts:
      'Keep receipts for work-related expenses such as equipment, training or travel: they can be claimed in the annual tax assessment.',
    veranlagung:
      'The annual tax assessment (Arbeitnehmerveranlagung) can be filed retroactively for up to five years.',
  },
  guideTitle: 'Filing guide (Arbeitnehmerveranlagung)',
  guide: [
    'Set up access to FinanzOnline (for example with ID Austria).',
    'Under “Forms” open the declaration for the employee assessment (form L1).',
    'Enter children and Family Bonus Plus with supplement L1k, and the sole earner / single parent credit with supplement L1ab.',
    'Record work-related expenses, special expenses and extraordinary burdens with receipts; check the commuter allowance with the BMF commuter calculator.',
    'Submit the declaration, wait for the notice and keep your receipts.',
  ],
  guideNote:
    'No guarantee; form names may change. The official forms and notes of the BMF (bmf.gv.at) prevail. This document is neither a tax return nor a substitute for tax advice.',
};

const ES: PdfExtra = {
  pageWord: 'Página',
  basicSummary: 'Resumen',
  basicNetLabel: 'Neto (pago regular)',
  basicAnnualNet: 'Neto (anual)',
  basicInputs: 'Datos básicos',
  basicOverview: 'Panorama general',
  upgradeTitle: 'Mejora a Pro',
  upgradeBody:
    'Para ver el desglose completo, las explicaciones detalladas y la guía de presentación.',
  appliedTitle: 'Datos tenidos en cuenta',
  appliedNone: 'No se indicaron deducciones ni franquicias especiales.',
  applied: {
    soleEarner: 'Deducción de único sustento / monoparental aplicada',
    familyBonusFull: 'Familienbonus Plus: bono completo',
    familyBonusShared: 'Familienbonus Plus: bono compartido',
    children: 'Hijos menores de 18: {u18}, mayores de 18 con ayuda familiar: {o18}',
    commute: 'Pendlerpauschale: {km} km de trayecto sencillo',
    allowance: 'Franquicia mensual: {amount}',
    benefitInKind: 'Retribución en especie (mensual): {amount}',
    companyCar: 'Coche de empresa (retribución en especie) tenido en cuenta',
  },
  explainTitle: 'Explicación de las partidas',
  explain: [
    {
      heading: 'Bruto',
      text: 'El bruto es tu salario antes de deducciones. El resultado supone 14 pagos iguales: doce mensualidades más la paga 13.ª y la 14.ª (vacaciones y Navidad).',
    },
    {
      heading: 'Seguridad social',
      text: 'La seguridad social incluye, entre otros, los seguros de enfermedad, pensiones y desempleo. Se calcula hasta la base máxima de cotización y reduce la base del impuesto retenido.',
    },
    {
      heading: 'Impuesto (Lohnsteuer)',
      text: 'El impuesto se calcula con la escala progresiva del impuesto sobre la renta. Las deducciones reducen directamente la cuota calculada; las franquicias reducen la base.',
    },
    {
      heading: 'Pagas 13.ª y 14.ª',
      text: 'La paga 13.ª y la 14.ª son pagos especiales que tributan de forma favorable dentro del límite de un sexto anual (Jahressechstel). La seguridad social se sigue pagando.',
    },
    {
      heading: 'Familienbonus Plus',
      text: 'El Familienbonus Plus es una deducción por hijo y reduce directamente el impuesto. Puede reclamarlo una persona completo o dos personas de forma compartida.',
    },
    {
      heading: 'Pendlerpauschale',
      text: 'La Pendlerpauschale tiene en cuenta el trayecto al trabajo. Que se aplique la pequeña o la grande depende de la distancia y de si el transporte público es razonable. El Pendlereuro se suma como deducción.',
    },
  ],
  tipsTitle: 'Consejos para optimizar',
  tipsIntro:
    'Indicaciones generales según tus datos. Comprueba por tu cuenta si te corresponden.',
  tip: {
    familyBonus:
      'Indicaste hijos pero no elegiste el Familienbonus Plus. Comprueba si puedes reclamarlo (completo o compartido).',
    soleEarner:
      'Indicaste hijos. Comprueba si te corresponde la deducción de único sustento o de monoparentalidad.',
    commute:
      'No indicaste trayecto al trabajo. Si te desplazas, la Pendlerpauschale puede reducir el impuesto; la calculadora de la BMF ayuda a comprobarlo.',
    allowance:
      'Un Freibetragsbescheid (por ejemplo por gastos deducibles o gastos especiales) puede reducir el impuesto retenido durante el año.',
    receipts:
      'Guarda los justificantes de gastos deducibles como material de trabajo, formación o viajes: pueden reclamarse en la liquidación anual.',
    veranlagung:
      'La liquidación anual (Arbeitnehmerveranlagung) puede solicitarse con carácter retroactivo hasta cinco años.',
  },
  guideTitle: 'Guía de presentación (Arbeitnehmerveranlagung)',
  guide: [
    'Configura el acceso a FinanzOnline (por ejemplo con ID Austria).',
    'En «Formularios» abre la declaración de la liquidación de asalariados (formulario L1).',
    'Indica hijos y Familienbonus Plus con el anexo L1k, y la deducción de único sustento o monoparental con el anexo L1ab.',
    'Registra gastos deducibles, gastos especiales y cargas extraordinarias con sus justificantes; comprueba la Pendlerpauschale con la calculadora de la BMF.',
    'Envía la declaración, espera la resolución y conserva los justificantes.',
  ],
  guideNote:
    'Sin garantía; los nombres de los formularios pueden cambiar. Prevalecen los formularios y las indicaciones oficiales de la BMF (bmf.gv.at). Este documento no es una declaración de impuestos ni sustituye el asesoramiento fiscal.',
};

export const PDF_EXTRA: Record<ExtraLang, PdfExtra> = { de: DE, en: EN, es: ES };

export function getPdfExtra(lang: Lang): PdfExtra {
  return PDF_EXTRA[(lang === 'en' || lang === 'es' ? lang : 'de') as ExtraLang];
}

/** Consejos aplicables a lo que el usuario introdujo. Siempre son "prueba si te corresponde". */
export function buildTips(request: CalculateRequest, extra: PdfExtra): string[] {
  const tips: string[] = [];
  const hasChildren =
    request.childrenUnder18 > 0 || request.childrenOver18WithFamilyAllowance > 0;

  if (hasChildren && request.familyBonus === 'none') tips.push(extra.tip.familyBonus);
  if (hasChildren && !request.soleEarnerDeduction) tips.push(extra.tip.soleEarner);
  if (!request.benefitInKindFromCompanyCar && request.commuteOneWayKm <= 0) {
    tips.push(extra.tip.commute);
  }
  if (request.taxFreeAllowanceMonthly <= 0) tips.push(extra.tip.allowance);
  tips.push(extra.tip.receipts, extra.tip.veranlagung);
  return tips;
}
