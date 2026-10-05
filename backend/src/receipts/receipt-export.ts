import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import type { Receipt } from './entities/receipt.entity';
import { GWG_LIMIT_EUR, type ReceiptCategory } from './receipt-parser';

/**
 * Exportacion de los recibos para la Arbeitnehmerveranlagung. Igual que el resto de PDFs del
 * producto, siempre en aleman oficial, independiente del idioma de la UI.
 */

export type ExportableReceipt = Pick<
  Receipt,
  | 'merchant'
  | 'date'
  | 'total'
  | 'vatRate'
  | 'vatAmount'
  | 'documentNumber'
  | 'category'
  | 'depreciation'
>;

interface CategoryInfo {
  label: string;
  /** Kennzahl del formulario L1 donde suele declararse; null si no son Werbungskosten. */
  l1Code: string | null;
}

const CATEGORY_INFO: Record<ReceiptCategory, CategoryInfo> = {
  workEquipment: { label: 'Arbeitsmittel', l1Code: '719' },
  training: { label: 'Aus- und Fortbildung', l1Code: '722' },
  travel: { label: 'Reisekosten', l1Code: '721' },
  homeServices: { label: 'Handwerkerleistungen', l1Code: null },
  other: { label: 'Sonstiges', l1Code: null },
};

const CATEGORY_ORDER: ReceiptCategory[] = [
  'workEquipment',
  'training',
  'travel',
  'homeServices',
  'other',
];

const DISCLAIMER = [
  'Diese Übersicht ist keine Steuerberatung. Kategorien und Kennzahlen sind Vorschläge auf Basis des Belegtextes',
  'und müssen vor der Übernahme in die Arbeitnehmerveranlagung (Formular L1 bzw. FinanzOnline) geprüft werden.',
  `Arbeitsmittel über ${formatEur(GWG_LIMIT_EUR)} (GWG-Grenze) sind in der Regel über die Nutzungsdauer abzuschreiben (AfA)`,
  'und nicht im Jahr der Anschaffung voll absetzbar. Handwerkerleistungen sind keine Werbungskosten.',
  'Bewahren Sie die Originalbelege auf: Das Finanzamt kann sie anfordern.',
].join(' ');

export function categoryLabel(category: ReceiptCategory): string {
  return CATEGORY_INFO[category]?.label ?? CATEGORY_INFO.other.label;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/** AAAA-MM-DD -> TT.MM.JJJJ */
export function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export interface CategorySummary {
  category: ReceiptCategory;
  label: string;
  l1Code: string | null;
  count: number;
  total: number;
}

/** Totales por categoria, en centimos para no arrastrar errores de coma flotante. */
export function summarize(receipts: ExportableReceipt[]): {
  categories: CategorySummary[];
  total: number;
} {
  const cents = new Map<ReceiptCategory, { count: number; cents: number }>();
  for (const r of receipts) {
    const entry = cents.get(r.category) ?? { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += Math.round((r.total ?? 0) * 100);
    cents.set(r.category, entry);
  }
  const categories = CATEGORY_ORDER.filter((c) => cents.has(c)).map((c) => ({
    category: c,
    label: CATEGORY_INFO[c].label,
    l1Code: CATEGORY_INFO[c].l1Code,
    count: cents.get(c)!.count,
    total: cents.get(c)!.cents / 100,
  }));
  const totalCents = [...cents.values()].reduce((s, e) => s + e.cents, 0);
  return { categories, total: totalCents / 100 };
}

/* ----------------------------------- CSV ----------------------------------- */

function csvField(value: string): string {
  // Evita que Excel interprete el campo como formula (inyeccion CSV).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function csvAmount(value: number | null): string {
  return value == null ? '' : value.toFixed(2).replace('.', ',');
}

/** CSV con punto y coma y coma decimal (Excel en aleman/austriaco), con BOM para los acentos. */
export function buildReceiptsCsv(receipts: ExportableReceipt[]): string {
  const header = [
    'Datum',
    'Händler',
    'Kategorie',
    'L1-Kennzahl (Vorschlag)',
    'Beleg-Nr.',
    'USt-Satz (%)',
    'USt (EUR)',
    'Betrag brutto (EUR)',
    'AfA (über GWG-Grenze)',
  ];
  const rows = receipts.map((r) => [
    formatDate(r.date),
    r.merchant,
    categoryLabel(r.category),
    CATEGORY_INFO[r.category]?.l1Code ?? '',
    r.documentNumber,
    r.vatRate == null ? '' : String(r.vatRate),
    csvAmount(r.vatAmount),
    csvAmount(r.total),
    r.depreciation ? 'ja' : 'nein',
  ]);
  const lines = [header, ...rows].map((row) => row.map(csvField).join(';'));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

/* ----------------------------------- PDF ----------------------------------- */

const MARGIN = 48;
const PAGE_BOTTOM = 842 - MARGIN; // A4: 595 x 842 pt
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#d1d5db';

// Roboto incrustada: las fuentes estandar del PDF solo cubren Latin-1 y los comercios pueden
// llevar letras como č, ş o cirilico (backend/assets/fonts, igual que en la app movil).
const FONT_DIR = join(__dirname, '..', '..', 'assets', 'fonts');
const REGULAR = 'Roboto';
const BOLD = 'Roboto-Bold';

interface Column {
  title: string;
  width: number;
  align?: 'left' | 'right';
}

export function buildReceiptsPdf(
  receipts: ExportableReceipt[],
  options: { year?: number; generatedAt?: Date } = {},
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    info: {
      Title: options.year ? `Belegübersicht ${options.year}` : 'Belegübersicht',
      Author: 'ÖstiTax',
    },
  });
  doc.registerFont(REGULAR, join(FONT_DIR, 'roboto-regular.ttf'));
  doc.registerFont(BOLD, join(FONT_DIR, 'roboto-bold.ttf'));
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const width = doc.page.width - MARGIN * 2;
  const generatedAt = options.generatedAt ?? new Date();
  const { categories, total } = summarize(receipts);

  // Cabecera
  doc
    .fillColor(INK)
    .font(BOLD)
    .fontSize(18)
    .text(options.year ? `Belegübersicht ${options.year}` : 'Belegübersicht');
  doc
    .moveDown(0.2)
    .font(REGULAR)
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      `ÖstiTax · erstellt am ${formatDate(generatedAt.toISOString())} · ${receipts.length} ${receipts.length === 1 ? 'Beleg' : 'Belege'}`,
    );
  doc.moveDown(1.2);

  // Resumen por categoria
  sectionTitle(doc, 'Zusammenfassung nach Kategorie');
  const summaryColumns: Column[] = [
    { title: 'Kategorie', width: width * 0.46 },
    { title: 'L1-Kennzahl*', width: width * 0.16 },
    { title: 'Anzahl', width: width * 0.14, align: 'right' },
    { title: 'Summe brutto', width: width * 0.24, align: 'right' },
  ];
  drawRow(
    doc,
    summaryColumns,
    summaryColumns.map((c) => c.title),
    { header: true },
  );
  for (const c of categories) {
    drawRow(doc, summaryColumns, [
      c.label,
      c.l1Code ? `KZ ${c.l1Code}` : '–',
      String(c.count),
      formatEur(c.total),
    ]);
  }
  drawRow(
    doc,
    summaryColumns,
    ['Gesamt', '', String(receipts.length), formatEur(total)],
    {
      bold: true,
    },
  );
  doc
    .moveDown(0.4)
    .font(REGULAR)
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      '* Vorschlag für das Formular L1 (Werbungskosten). Bitte vor der Übernahme prüfen.',
      MARGIN,
      doc.y,
      { width },
    );
  doc.moveDown(1.2);

  // Detalle
  sectionTitle(doc, 'Einzelbelege');
  const detailColumns: Column[] = [
    { title: 'Datum', width: width * 0.13 },
    { title: 'Händler', width: width * 0.27 },
    { title: 'Kategorie', width: width * 0.2 },
    { title: 'Beleg-Nr.', width: width * 0.14 },
    { title: 'USt', width: width * 0.11, align: 'right' },
    { title: 'Betrag', width: width * 0.15, align: 'right' },
  ];
  drawRow(
    doc,
    detailColumns,
    detailColumns.map((c) => c.title),
    { header: true },
  );
  if (receipts.length === 0) {
    doc
      .font(REGULAR)
      .fontSize(9)
      .fillColor(MUTED)
      .text('Keine Belege vorhanden.', MARGIN);
  }
  for (const r of receipts) {
    const row = [
      formatDate(r.date),
      r.merchant || '–',
      categoryLabel(r.category) + (r.depreciation ? ' (AfA)' : ''),
      r.documentNumber || '–',
      r.vatRate == null ? '–' : `${r.vatRate} %`,
      r.total == null ? '–' : formatEur(r.total),
    ];
    if (doc.y + rowHeight(doc, detailColumns, row) > PAGE_BOTTOM) {
      doc.addPage();
      drawRow(
        doc,
        detailColumns,
        detailColumns.map((c) => c.title),
        { header: true },
      );
    }
    drawRow(doc, detailColumns, row);
  }

  // Aviso legal
  doc.moveDown(1.5);
  if (doc.y > PAGE_BOTTOM - 80) doc.addPage();
  doc
    .font(REGULAR)
    .fontSize(8)
    .fillColor(MUTED)
    .text(DISCLAIMER, MARGIN, doc.y, { width, align: 'justify' });

  doc.end();
  return done;
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc.font(BOLD).fontSize(11).fillColor(INK).text(title, MARGIN);
  doc.moveDown(0.4);
}

function rowHeight(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  cells: string[],
): number {
  doc.font(REGULAR).fontSize(9);
  return (
    Math.max(
      ...cells.map((cell, i) =>
        doc.heightOfString(cell, { width: columns[i].width - 6 }),
      ),
    ) + 8
  );
}

function drawRow(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  cells: string[],
  style: { header?: boolean; bold?: boolean } = {},
): void {
  const height = rowHeight(doc, columns, cells);
  if (doc.y + height > PAGE_BOTTOM) doc.addPage();
  const top = doc.y;
  let x = MARGIN;
  doc
    .font(style.header || style.bold ? BOLD : REGULAR)
    .fontSize(9)
    .fillColor(style.header ? MUTED : INK);
  cells.forEach((cell, i) => {
    const col = columns[i];
    doc.text(cell, x + 3, top + 4, {
      width: col.width - 6,
      align: col.align ?? 'left',
    });
    x += col.width;
  });
  const bottom = top + height;
  doc
    .moveTo(MARGIN, bottom)
    .lineTo(x, bottom)
    .lineWidth(style.header || style.bold ? 0.8 : 0.4)
    .strokeColor(LINE)
    .stroke();
  doc.x = MARGIN;
  doc.y = bottom;
}
