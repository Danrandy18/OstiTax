import type { Lang } from '../i18n/translations';
import { TRANSLATIONS } from '../i18n/translations';
import { PDF_OFFICIAL_DE } from './pdf-official-de';

/**
 * El alemán oficial (PDF_OFFICIAL_DE) usa la terminología exacta exigida por
 * CLAUDE.md (Bruttobezug/Sozialversicherung/Lohnsteuer/Nettobezug) y nunca
 * cambia. Los demás idiomas son una comodidad Pro adicional: reutilizan el
 * mismo vocabulario ya traducido en la UI (no hay "terminología oficial"
 * equivalente fuera de alemán).
 */
export interface PdfSchema {
  documentTitle: string;
  productName: string;
  standPrefix: string;
  createdPrefix: string;
  sectionInputs: string;
  sectionResult: string;
  pageLabel: string;
  disclaimer: string;
  footerTagline: string;
  employment: { employee: string; apprentice: string; pensioner: string };
  incomePeriod: { monthly: string; yearly: string };
  labels: {
    employment: string;
    gross: string;
    state: string;
    soleEarner: string;
    familyBonus: string;
    benefitInKind: string;
    companyCar: string;
    taxFreeAllowance: string;
    commute: string;
    childrenUnder18: string;
    childrenOver18: string;
    companyCarAcquisitionCost: string;
    companyCarCo2: string;
    companyCarRegistrationYear: string;
    companyCarHalfBenefit: string;
    commuteKm: string;
    publicTransportReasonable: string;
    commuteDaysLabel: string;
  };
  familyBonus: { none: string; full: string; shared: string };
  yesNo: { yes: string; no: string };
  columns: { recurring: string; thirteenth: string; fourteenth: string; annual: string };
  rows: { gross: string; socialInsurance: string; incomeTax: string; net: string };
  states: Record<string, string>;
  commuteDays: {
    less_than_4: string;
    from_4_to_7: string;
    from_8_to_10: string;
    more_than_10: string;
  };
}

interface PdfMeta {
  documentTitle: string;
  standPrefix: string;
  createdPrefix: string;
  sectionInputs: string;
  pageLabel: string;
  labelEmployment: string;
  disclaimer: string;
  footerTagline: string;
}

const PDF_META: Record<Exclude<Lang, 'de'>, PdfMeta> = {
  en: {
    documentTitle: 'Gross-to-Net Calculation',
    standPrefix: 'As of',
    createdPrefix: 'Created on',
    sectionInputs: 'Inputs',
    pageLabel: 'Page 1/1',
    labelEmployment: 'Employment type',
    disclaimer:
      'This calculation is for guidance only. The result matches the shown payment assuming 14 equal monthly payments. Deviations due to special payments, benefits in kind or allowances are possible.',
    footerTagline: 'Digital net salary calculator for Austria',
  },
  es: {
    documentTitle: 'Cálculo de bruto a neto',
    standPrefix: 'Vigente desde',
    createdPrefix: 'Generado el',
    sectionInputs: 'Datos ingresados',
    pageLabel: 'Página 1/1',
    labelEmployment: 'Tipo de empleo',
    disclaimer:
      'Este cálculo es solo orientativo. El resultado corresponde al pago mostrado asumiendo 14 pagos mensuales iguales. Puede haber variaciones por pagos especiales, beneficios en especie o exenciones.',
    footerTagline: 'Calculadora digital de salario neto para Austria',
  },
  tr: {
    documentTitle: 'Brütten Nete Hesaplama',
    standPrefix: 'Geçerlilik tarihi',
    createdPrefix: 'Oluşturulma tarihi',
    sectionInputs: 'Girdiler',
    pageLabel: 'Sayfa 1/1',
    labelEmployment: 'Çalışma durumu',
    disclaimer:
      'Bu hesaplama yalnızca fikir vermek içindir. Sonuç, 14 eşit aylık ödeme varsayımıyla gösterilen tutara karşılık gelir. Ek ödemeler, ayni menfaatler veya muafiyetler nedeniyle farklılıklar olabilir.',
    footerTagline: 'Avusturya için dijital net maaş hesaplayıcı',
  },
  bcs: {
    documentTitle: 'Izračun bruto u neto',
    standPrefix: 'Vrijedi od',
    createdPrefix: 'Kreirano',
    sectionInputs: 'Unosi',
    pageLabel: 'Stranica 1/1',
    labelEmployment: 'Vrsta zaposlenja',
    disclaimer:
      'Ovaj izračun služi samo kao orijentacija. Rezultat odgovara prikazanom iznosu uz pretpostavku 14 jednakih mjesečnih isplata. Moguća su odstupanja zbog posebnih isplata, naknada u naturi ili neoporezivih iznosa.',
    footerTagline: 'Digitalni kalkulator neto plate za Austriju',
  },
  uk: {
    documentTitle: 'Розрахунок брутто в нетто',
    standPrefix: 'Станом на',
    createdPrefix: 'Створено',
    sectionInputs: 'Введені дані',
    pageLabel: 'Сторінка 1/1',
    labelEmployment: 'Тип зайнятості',
    disclaimer:
      'Цей розрахунок є лише орієнтовним. Результат відповідає показаній виплаті за умови 14 однакових щомісячних виплат. Можливі відхилення через спецвиплати, негрошові вигоди чи пільги.',
    footerTagline: 'Цифровий калькулятор нетто зарплати для Австрії',
  },
};

export function getPdfSchema(lang: Lang): PdfSchema {
  if (lang === 'de') {
    return { ...PDF_OFFICIAL_DE, footerTagline: 'Digitale Gehaltsberechnung Österreich' };
  }

  const t = TRANSLATIONS[lang];
  const meta = PDF_META[lang];

  return {
    documentTitle: meta.documentTitle,
    productName: 'ÖstiTax',
    standPrefix: meta.standPrefix,
    createdPrefix: meta.createdPrefix,
    sectionInputs: meta.sectionInputs,
    sectionResult: t.results,
    pageLabel: meta.pageLabel,
    disclaimer: meta.disclaimer,
    footerTagline: meta.footerTagline,
    employment: {
      employee: t.employmentEmployee,
      apprentice: t.employmentApprentice,
      pensioner: t.employmentPensioner,
    },
    incomePeriod: { monthly: t.monthly, yearly: t.yearly },
    labels: {
      employment: meta.labelEmployment,
      gross: t.grossAmount,
      state: t.state,
      soleEarner: t.soleEarner,
      familyBonus: t.familyBonus,
      benefitInKind: t.benefitInKind,
      companyCar: t.companyCarBenefit,
      taxFreeAllowance: t.taxFreeAllowance,
      commute: t.commute,
      childrenUnder18: t.childrenUnder18,
      childrenOver18: t.childrenOver18,
      companyCarAcquisitionCost: t.companyCarAcquisitionCost,
      companyCarCo2: t.companyCarCo2,
      companyCarRegistrationYear: t.companyCarRegistrationYear,
      companyCarHalfBenefit: t.companyCarHalfBenefit,
      commuteKm: t.commuteKm,
      publicTransportReasonable: t.publicTransportReasonable,
      commuteDaysLabel: t.commuteDays,
    },
    familyBonus: { none: t.familyBonusNone, full: t.familyBonusFull, shared: t.familyBonusShared },
    yesNo: { yes: t.yes, no: t.no },
    columns: { recurring: t.recurring, thirteenth: t.thirteenth, fourteenth: t.fourteenth, annual: t.annual },
    rows: { gross: t.gross, socialInsurance: t.socialInsurance, incomeTax: t.incomeTax, net: t.net },
    states: t.states,
    commuteDays: {
      less_than_4: t.commuteDaysLess4,
      from_4_to_7: t.commuteDays4to7,
      from_8_to_10: t.commuteDays8to10,
      more_than_10: t.commuteDaysMore10,
    },
  };
}
