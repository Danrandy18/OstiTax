/**
 * Extrae los datos clave de un recibo o factura a partir del TEXTO que leyó el OCR del cliente
 * (la imagen no sale del dispositivo) y sugiere la categoria fiscal austriaca.
 *
 * Es logica pura y sin dependencias de Nest para poder probarla aislada. Las categorias son una
 * SUGERENCIA (no asesoramiento fiscal): el cliente siempre muestra una pantalla de revision.
 */

export type VatRate = 0 | 10 | 13 | 20;

export type ReceiptCategory =
  | 'workEquipment' // Arbeitsmittel
  | 'training' // Fortbildung / Umschulung
  | 'travel' // Reisekosten
  | 'homeServices' // Handwerker / haushaltsnahe Dienstleistungen
  | 'other';

export interface ReceiptField<T> {
  value: T | null;
  /** Linea del recibo de la que se leyo el dato: el cliente la usa para resaltar/hacer zoom. */
  evidence: string | null;
}

export interface ParsedReceipt {
  merchant: ReceiptField<string>;
  /** Fecha ISO (AAAA-MM-DD). */
  date: ReceiptField<string>;
  /** Importe total con impuestos incluidos. */
  total: ReceiptField<number>;
  vat: {
    rate: VatRate | null;
    /** Cuota de IVA; null si hay varios tipos y no se puede calcular con seguridad. */
    amount: number | null;
    net: number | null;
    /** Todos los tipos de IVA detectados (0, 10, 13, 20). */
    rates: VatRate[];
    evidence: string | null;
  };
  documentNumber: ReceiptField<string>;
  category: ReceiptCategory;
  /** Palabras del recibo que llevaron a esa categoria. */
  categoryEvidence: string[];
  /** true si un bien de trabajo supera el limite GWG: se amortiza en varios anos (AfA). */
  depreciation: boolean;
  gwgLimit: number;
  /** Codigos de aviso para la pantalla de revision. */
  warnings: string[];
}

/** Limite de bienes de escaso valor (GWG) en Austria desde 2023. Verificar con un asesor. */
export const GWG_LIMIT_EUR = 1000;

const VAT_RATES: readonly VatRate[] = [20, 13, 10, 0];

const AMOUNT_RE =
  /(?<![\d.,])\d{1,3}(?:\.\d{3})*,\d{2}(?![\d.,]?\d)|(?<![\d.,])\d+[.,]\d{2}(?![\d.,]?\d)/g;

/** Convierte "1.234,56" o "23.45" en numero. */
export function toAmount(token: string): number {
  const normalized = token.includes(',')
    ? token.replace(/\./g, '').replace(',', '.')
    : token;
  return parseFloat(normalized);
}

function amountsIn(line: string): number[] {
  return (line.match(AMOUNT_RE) ?? []).map(toAmount);
}

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
}

/* ---------------------------------- total ---------------------------------- */

// De mas a menos especifico: se usa el primer nivel que encuentre algo.
const TOTAL_KEYWORDS: RegExp[] = [
  /zu zahlen|zahlbetrag|amount due|total due|zahlung/i,
  /gesamtbetrag|rechnungsbetrag|endbetrag|endsumme|bruttobetrag|gesamtsumme/i,
  /\bsumme\b|\btotal\b|\bgesamt\b|\bbetrag\b|\bbrutto\b/i,
];
const TOTAL_EXCLUDE =
  /netto|zwischensumme|r[üu]ckgeld|gegeben|wechselgeld|\bmwst\b|\bust\b|mehrwertsteuer|umsatzsteuer|rabatt/i;

function findTotal(lines: string[]): {
  field: ReceiptField<number>;
  warnings: string[];
} {
  for (const keyword of TOTAL_KEYWORDS) {
    const hits: { value: number; evidence: string }[] = [];
    lines.forEach((line, index) => {
      if (!keyword.test(line) || TOTAL_EXCLUDE.test(line)) return;
      const onLine = amountsIn(line);
      const amounts =
        onLine.length > 0 ? onLine : amountsIn(lines[index + 1] ?? '');
      if (amounts.length > 0) {
        hits.push({ value: amounts[amounts.length - 1], evidence: line });
      }
    });
    // El total suele estar al final del recibo: se toma el ultimo.
    const last = hits[hits.length - 1];
    if (last) {
      return {
        field: { value: last.value, evidence: last.evidence },
        warnings: [],
      };
    }
  }

  let max: { value: number; evidence: string } | null = null;
  for (const line of lines) {
    for (const value of amountsIn(line)) {
      if (!max || value > max.value) max = { value, evidence: line };
    }
  }
  return max
    ? {
        field: { value: max.value, evidence: max.evidence },
        warnings: ['total_guessed'],
      }
    : { field: { value: null, evidence: null }, warnings: ['total_missing'] };
}

/* ----------------------------------- IVA ----------------------------------- */

const TAX_WORDS =
  /mwst|\bust\b|umsatzsteuer|mehrwertsteuer|steuer|\bvat\b|netto|brutto/i;
const DISCOUNT_WORDS = /rabatt|skonto|discount|nachlass|ersparnis/i;

function findVat(
  lines: string[],
  total: number | null,
): { vat: ParsedReceipt['vat']; warnings: string[] } {
  const found = new Map<VatRate, { amounts: number[]; evidence: string }>();

  for (const line of lines) {
    if (DISCOUNT_WORDS.test(line)) continue;
    for (const match of line.matchAll(/(\d{1,2})(?:[.,]0{1,2})?\s*%/g)) {
      const rate = Number(match[1]) as VatRate;
      if (!VAT_RATES.includes(rate)) continue;
      // Solo lineas de impuestos o con importes (tabla de IVA); evita "20 % mas de contenido".
      if (!TAX_WORDS.test(line) && amountsIn(line).length === 0) continue;
      const entry = found.get(rate) ?? { amounts: [], evidence: line };
      entry.amounts.push(...amountsIn(line.replace(match[0], ' ')));
      found.set(rate, entry);
    }
  }

  const rates = [...found.keys()].sort((a, b) => b - a) as VatRate[];
  if (rates.length === 0) {
    return {
      vat: { rate: null, amount: null, net: null, rates: [], evidence: null },
      warnings: ['vat_missing'],
    };
  }

  if (rates.length > 1) {
    return {
      vat: {
        rate: rates[0],
        amount: null,
        net: null,
        rates,
        evidence: found.get(rates[0])!.evidence,
      },
      warnings: ['vat_mixed_rates'],
    };
  }

  const rate = rates[0];
  const entry = found.get(rate)!;
  if (total === null) {
    return {
      vat: { rate, amount: null, net: null, rates, evidence: entry.evidence },
      warnings: [],
    };
  }

  const computed = round2(total - total / (1 + rate / 100));
  // Si el recibo trae la cuota impresa y coincide con el calculo, se usa la impresa.
  const printed = entry.amounts.find(
    (value) => Math.abs(value - computed) <= 0.03,
  );
  const amount = printed ?? computed;
  return {
    vat: {
      rate,
      amount,
      net: round2(total - amount),
      rates,
      evidence: entry.evidence,
    },
    warnings: [],
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ---------------------------------- fecha ---------------------------------- */

const DATE_KEYWORDS = /datum|date|rechnungsdatum|leistungs|\bam\b/i;

function findDate(lines: string[]): ReceiptField<string> {
  const now = new Date();
  const maxYear = now.getFullYear() + 1;
  const candidates: { iso: string; evidence: string; preferred: boolean }[] =
    [];

  const push = (y: number, m: number, d: number, line: string) => {
    const year = y < 100 ? 2000 + y : y;
    const date = new Date(Date.UTC(year, m - 1, d));
    const valid =
      year >= 2000 &&
      year <= maxYear &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d;
    if (!valid) return;
    const iso = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    candidates.push({
      iso,
      evidence: line,
      preferred: DATE_KEYWORDS.test(line),
    });
  };

  for (const line of lines) {
    for (const m of line.matchAll(
      /(?<!\d)(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?!\d)/g,
    )) {
      push(Number(m[3]), Number(m[2]), Number(m[1]), line);
    }
    for (const m of line.matchAll(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g)) {
      push(Number(m[1]), Number(m[2]), Number(m[3]), line);
    }
  }

  const chosen = candidates.find((c) => c.preferred) ?? candidates[0];
  return chosen
    ? { value: chosen.iso, evidence: chosen.evidence }
    : { value: null, evidence: null };
}

/* ---------------------------- numero de documento --------------------------- */

const DOC_NUMBER_RE =
  /(?:rechnungs?[- ]?(?:nummer|nr\.?)|rechnung\s*nr\.?|belegnummer|beleg[- ]?nr\.?|bon[- ]?nummer|bon[- ]?nr\.?|kassenbon\s*nr\.?|invoice\s*(?:no\.?|number|#)|re[- ]?nr\.?|rech\.?[- ]?nr\.?)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-/.]{2,})/i;

function findDocumentNumber(lines: string[]): ReceiptField<string> {
  for (const line of lines) {
    const match = DOC_NUMBER_RE.exec(line);
    if (match && /\d/.test(match[1])) {
      return { value: match[1].replace(/[.,;]+$/, ''), evidence: line };
    }
  }
  return { value: null, evidence: null };
}

/* -------------------------------- comerciante ------------------------------- */

const MERCHANT_SKIP =
  /^(rechnung|beleg|kassenbon|bon\b|datum|tel|telefon|fax|uid|atu|www\.|http|e-?mail|@|kundennummer|seite|page)/i;
const COMPANY_SUFFIX =
  /\b(gmbh|g\.m\.b\.h|ges\.?m\.?b\.?h|kg|og|ag|e\.u\.|eu|co\.?|handels|markt|shop|store)\b/i;

function findMerchant(lines: string[]): ReceiptField<string> {
  const head = lines.slice(0, 8);
  const candidates = head.filter(
    (line) =>
      !MERCHANT_SKIP.test(line) &&
      (line.match(/\p{L}/gu) ?? []).length >= 3 &&
      amountsIn(line).length === 0,
  );
  const chosen =
    candidates.find((line) => COMPANY_SUFFIX.test(line)) ?? candidates[0];
  return chosen
    ? { value: chosen.slice(0, 60), evidence: chosen }
    : { value: null, evidence: null };
}

/* -------------------------------- categoria --------------------------------- */

// Terminos alemanes habituales (y algunos comercios). El orden desempata.
const CATEGORY_TERMS: Record<Exclude<ReceiptCategory, 'other'>, string[]> = {
  workEquipment: [
    'laptop',
    'notebook',
    'computer',
    'monitor',
    'bildschirm',
    'tastatur',
    'maus',
    'drucker',
    'toner',
    'tinte',
    'papier',
    'bürobedarf',
    'büro',
    'schreibtisch',
    'bürostuhl',
    'festplatte',
    'usb',
    'headset',
    'webcam',
    'smartphone',
    'tablet',
    'ordner',
    'kugelschreiber',
    'software',
    'lizenz',
    'arbeitsmittel',
    'mediamarkt',
    'saturn',
    'conrad',
    'staples',
    'cyberport',
    'alternate',
  ],
  training: [
    'kurs',
    'seminar',
    'schulung',
    'fortbildung',
    'weiterbildung',
    'ausbildung',
    'studiengebühr',
    'kursgebühr',
    'lehrgang',
    'workshop',
    'webinar',
    'prüfungsgebühr',
    'fachbuch',
    'buch',
    'bücher',
    'lehrbuch',
    'udemy',
    'coursera',
    'wifi',
    'bfi',
    'volkshochschule',
    'thalia',
  ],
  travel: [
    'fahrkarte',
    'ticket',
    'fahrschein',
    'öbb',
    'wiener linien',
    'westbahn',
    'flixbus',
    'bahn',
    'straßenbahn',
    'u-bahn',
    'parkschein',
    'parkgebühr',
    'parkhaus',
    'parkplatz',
    'garage',
    'maut',
    'vignette',
    'tankstelle',
    'diesel',
    'benzin',
    'omv',
    'shell',
    'taxi',
    'uber',
    'bolt',
    'reisekosten',
    'hotel',
    'nächtigung',
    'übernachtung',
  ],
  homeServices: [
    'handwerker',
    'reparatur',
    'installateur',
    'elektriker',
    'maler',
    'tischler',
    'schlosser',
    'monteur',
    'arbeitszeit',
    'arbeitsstunden',
    'lohnkosten',
    'arbeitskosten',
    'montage',
    'sanierung',
    'wartung',
    'haushaltsnahe',
  ],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findCategory(text: string): {
  category: ReceiptCategory;
  evidence: string[];
} {
  const lower = text.toLowerCase();
  let best: { category: ReceiptCategory; evidence: string[] } = {
    category: 'other',
    evidence: [],
  };

  for (const [category, terms] of Object.entries(CATEGORY_TERMS) as [
    Exclude<ReceiptCategory, 'other'>,
    string[],
  ][]) {
    const hits = terms.filter((term) =>
      new RegExp(`(?<![\\p{L}])${escapeRegExp(term)}(?![\\p{L}])`, 'iu').test(
        lower,
      ),
    );
    if (hits.length > best.evidence.length) best = { category, evidence: hits };
  }
  return best;
}

/* --------------------------------- conjunto --------------------------------- */

export function parseReceipt(text: string): ParsedReceipt {
  const lines = toLines(text);
  const { field: total, warnings: totalWarnings } = findTotal(lines);
  const { vat, warnings: vatWarnings } = findVat(lines, total.value);
  const date = findDate(lines);
  const merchant = findMerchant(lines);
  const documentNumber = findDocumentNumber(lines);
  const { category, evidence } = findCategory(text);

  const warnings = [...totalWarnings, ...vatWarnings];
  if (date.value === null) warnings.push('date_missing');
  if (merchant.value === null) warnings.push('merchant_missing');

  const depreciation =
    category === 'workEquipment' &&
    total.value !== null &&
    total.value > GWG_LIMIT_EUR;

  return {
    merchant,
    date,
    total,
    vat,
    documentNumber,
    category,
    categoryEvidence: evidence,
    depreciation,
    gwgLimit: GWG_LIMIT_EUR,
    warnings,
  };
}
