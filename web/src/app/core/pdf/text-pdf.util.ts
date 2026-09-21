import type {
  CalculateRequest,
  CalculateResponse,
  PaymentBreakdown,
} from '../models/api.models';
import type { Lang } from '../i18n/translations';
import { formatOfficialDate, formatOfficialEuro } from './pdf-official-de';
import { getPdfSchema, type PdfSchema } from './pdf-translations';
import { buildTips, getPdfExtra, type PdfExtra, type PdfTier } from './pdf-extra';

export type { PdfTier } from './pdf-extra';

/**
 * Generador PDF sin dependencias externas: bytes crudos + WinAnsiEncoding.
 * WinAnsi solo cubre Europa Occidental (soporta ä/ö/ü/ß/ñ/é/€), por eso el
 * idioma del PDF (función Pro) se ofrece solo en de/en/es: tr/bcs/uk usan
 * caracteres (ş/ğ/ı, š/č/ć/đ, cirílico) que esta fuente estándar no puede
 * dibujar sin incrustar una fuente TrueType completa.
 */
export const PDF_SUPPORTED_LANGS: readonly Lang[] = ['de', 'en', 'es'];

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 44;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

type Color = readonly [number, number, number];

const COLOR_BRAND: Color = [0.051, 0.361, 0.337];
const COLOR_BRAND_TEXT_TINT: Color = [0.914, 0.945, 0.937];
const COLOR_SUCCESS: Color = [0.122, 0.478, 0.302];
const COLOR_SUCCESS_TINT: Color = [0.906, 0.949, 0.918];
const COLOR_TEXT: Color = [0.129, 0.114, 0.09];
const COLOR_MUTED: Color = [0.447, 0.42, 0.369];
const COLOR_BORDER: Color = [0.902, 0.882, 0.843];
const COLOR_WHITE: Color = [1, 1, 1];

/** Acumulador de bytes crudo; evita que Blob(string) reinterprete acentos como UTF-8. */
class ByteBuffer {
  private bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  ascii(text: string): this {
    for (let i = 0; i < text.length; i += 1) {
      this.bytes.push(text.charCodeAt(i) & 0xff);
    }
    return this;
  }

  /** Codifica como WinAnsiEncoding y escapa "(", ")", "\" para strings literales PDF. */
  latin1Escaped(text: string): this {
    for (const char of text) {
      const code = toWinAnsiByte(char);
      if (code === 0x28 || code === 0x29 || code === 0x5c) {
        this.bytes.push(0x5c, code);
      } else {
        this.bytes.push(code);
      }
    }
    return this;
  }

  raw(bytes: Uint8Array): this {
    for (let i = 0; i < bytes.length; i += 1) {
      this.bytes.push(bytes[i]);
    }
    return this;
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

function toWinAnsiByte(char: string): number {
  const cp = char.codePointAt(0) ?? 0x3f;
  switch (cp) {
    case 0x20ac:
      return 0x80; // €
    case 0x2013:
      return 0x96; // –
    case 0x2014:
      return 0x97; // —
    case 0x2018:
      return 0x91;
    case 0x2019:
      return 0x92;
    case 0x201c:
      return 0x93;
    case 0x201d:
      return 0x94;
    default:
      return cp <= 0xff ? cp : 0x3f;
  }
}

function num(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function rgb(color: Color): string {
  return `${num(color[0])} ${num(color[1])} ${num(color[2])}`;
}

type Font = 'F1' | 'F2' | 'F3' | 'F4';

function drawText(
  buf: ByteBuffer,
  x: number,
  y: number,
  font: Font,
  size: number,
  text: string,
  color: Color = COLOR_TEXT,
): void {
  buf.ascii('BT\n');
  buf.ascii(`${rgb(color)} rg\n`);
  buf.ascii(`/${font} ${num(size)} Tf\n`);
  buf.ascii(`1 0 0 1 ${num(x)} ${num(y)} Tm\n`);
  buf.ascii('(');
  buf.latin1Escaped(text);
  buf.ascii(') Tj\nET\n');
}

/** Alinea a la derecha asumiendo fuente monoespaciada (Courier: 0.6em por carácter). */
function drawTextRight(
  buf: ByteBuffer,
  rightX: number,
  y: number,
  font: Font,
  size: number,
  text: string,
  color: Color = COLOR_TEXT,
): void {
  const width = text.length * size * 0.6;
  drawText(buf, rightX - width, y, font, size, text, color);
}

function fillRect(buf: ByteBuffer, x: number, y: number, w: number, h: number, color: Color): void {
  buf.ascii(`q\n${rgb(color)} rg\n${num(x)} ${num(y)} ${num(w)} ${num(h)} re f\nQ\n`);
}

function drawLine(buf: ByteBuffer, x1: number, y1: number, x2: number, y2: number, color: Color, width = 0.75): void {
  buf.ascii(`q\n${num(width)} w\n${rgb(color)} RG\n${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S\nQ\n`);
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function assemblePdf(pages: ByteBuffer[]): Blob {
  const doc = new ByteBuffer();
  doc.ascii('%PDF-1.4\n');
  const offsets: number[] = [0];

  const fontObject = (base: string) =>
    `<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>endobj\n`;

  // Objetos: 1 catalogo, 2 paginas, 3-6 fuentes, y despues (pagina, contenido) por cada pagina.
  const firstPageObj = 7;
  const kids = pages.map((_, i) => `${firstPageObj + i * 2} 0 R`).join(' ');

  offsets.push(doc.length);
  doc.ascii('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');

  offsets.push(doc.length);
  doc.ascii(`2 0 obj<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>endobj\n`);

  offsets.push(doc.length);
  doc.ascii(`3 0 obj${fontObject('Helvetica')}`);
  offsets.push(doc.length);
  doc.ascii(`4 0 obj${fontObject('Helvetica-Bold')}`);
  offsets.push(doc.length);
  doc.ascii(`5 0 obj${fontObject('Courier')}`);
  offsets.push(doc.length);
  doc.ascii(`6 0 obj${fontObject('Courier-Bold')}`);

  pages.forEach((content, i) => {
    const pageObj = firstPageObj + i * 2;
    const contentObj = pageObj + 1;

    offsets.push(doc.length);
    doc.ascii(
      `${pageObj} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentObj} 0 R ` +
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> >>endobj\n',
    );

    offsets.push(doc.length);
    const contentBytes = content.toUint8Array();
    doc.ascii(`${contentObj} 0 obj<< /Length ${contentBytes.length} >>\nstream\n`);
    doc.raw(contentBytes);
    doc.ascii('\nendstream\nendobj\n');
  });

  const xrefOffset = doc.length;
  const objectCount = offsets.length;
  doc.ascii(`xref\n0 ${objectCount}\n`);
  doc.ascii('0000000000 65535 f \n');
  for (let i = 1; i < objectCount; i += 1) {
    doc.ascii(`${offsets[i].toString().padStart(10, '0')} 00000 n \n`);
  }
  doc.ascii(`trailer<< /Size ${objectCount} /Root 1 0 R >>\n`);
  doc.ascii(`startxref\n${xrefOffset}\n%%EOF`);

  return new Blob([doc.toUint8Array().buffer as ArrayBuffer], { type: 'application/pdf' });
}

function buildInputRows(request: CalculateRequest, de: PdfSchema): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    [de.labels.employment, de.employment[request.employmentType]],
    [
      de.labels.gross,
      `${formatOfficialEuro(request.grossAmount)} (${de.incomePeriod[request.incomePeriod]})`,
    ],
    [de.labels.state, de.states[request.state]],
    [de.labels.soleEarner, request.soleEarnerDeduction ? de.yesNo.yes : de.yesNo.no],
    [de.labels.familyBonus, de.familyBonus[request.familyBonus]],
  ];

  if (
    request.soleEarnerDeduction ||
    request.familyBonus !== 'none' ||
    request.childrenUnder18 > 0 ||
    request.childrenOver18WithFamilyAllowance > 0
  ) {
    rows.push(
      [de.labels.childrenUnder18, String(request.childrenUnder18)],
      [de.labels.childrenOver18, String(request.childrenOver18WithFamilyAllowance)],
    );
  }

  rows.push([de.labels.benefitInKind, formatOfficialEuro(request.benefitInKindMonthly)]);
  rows.push([de.labels.companyCar, request.benefitInKindFromCompanyCar ? de.yesNo.yes : de.yesNo.no]);

  if (request.benefitInKindFromCompanyCar && request.companyCar) {
    const car = request.companyCar;
    rows.push(
      [`  ${de.labels.companyCarAcquisitionCost}`, formatOfficialEuro(car.acquisitionCost)],
      [`  ${de.labels.companyCarCo2}`, String(car.co2GramsPerKm)],
      [`  ${de.labels.companyCarRegistrationYear}`, String(car.firstRegistrationYear)],
      [`  ${de.labels.companyCarHalfBenefit}`, car.halfBenefit ? de.yesNo.yes : de.yesNo.no],
    );
  }

  rows.push([de.labels.taxFreeAllowance, formatOfficialEuro(request.taxFreeAllowanceMonthly)]);

  if (!request.benefitInKindFromCompanyCar && request.commuteOneWayKm > 0) {
    rows.push(
      [de.labels.commuteKm, `${request.commuteOneWayKm} km`],
      [de.labels.publicTransportReasonable, request.publicTransportReasonable ? de.yesNo.yes : de.yesNo.no],
      [de.labels.commuteDaysLabel, de.commuteDays[request.commuteDaysPerMonth]],
    );
  }

  return rows;
}

const HEADER_H = 74;

function drawHeader(buf: ByteBuffer, de: PdfSchema, tableYear: number): number {
  fillRect(buf, 0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, COLOR_BRAND);
  drawText(buf, MARGIN_X, PAGE_H - 30, 'F2', 19, de.productName, COLOR_WHITE);
  drawText(buf, MARGIN_X, PAGE_H - 48, 'F1', 10.5, de.documentTitle, COLOR_WHITE);
  drawTextRight(buf, PAGE_W - MARGIN_X, PAGE_H - 30, 'F3', 9, `${de.standPrefix}: ${tableYear}`, COLOR_WHITE);
  drawTextRight(
    buf,
    PAGE_W - MARGIN_X,
    PAGE_H - 44,
    'F3',
    9,
    `${de.createdPrefix}: ${formatOfficialDate(new Date())}`,
    COLOR_WHITE,
  );
  return PAGE_H - HEADER_H - 34;
}

function drawFooter(buf: ByteBuffer, de: PdfSchema, extra: PdfExtra, page: number, total: number): void {
  drawLine(buf, MARGIN_X, 40, PAGE_W - MARGIN_X, 40, COLOR_BORDER);
  drawText(buf, MARGIN_X, 28, 'F1', 8, `${de.productName} - ${de.footerTagline}`, COLOR_MUTED);
  drawTextRight(buf, PAGE_W - MARGIN_X, 28, 'F1', 8, `${extra.pageWord} ${page}/${total}`, COLOR_MUTED);
}

function drawSectionTitle(buf: ByteBuffer, y: number, title: string): number {
  drawText(buf, MARGIN_X, y, 'F2', 12.5, title, COLOR_BRAND);
  drawLine(buf, MARGIN_X, y - 8, PAGE_W - MARGIN_X, y - 8, COLOR_BORDER);
  return y - 26;
}

function drawDisclaimer(buf: ByteBuffer, de: PdfSchema, y: number): number {
  fillRect(buf, MARGIN_X - 8, y - 34, CONTENT_W + 16, 44, COLOR_BRAND_TEXT_TINT);
  let hintY = y - 8;
  for (const line of wrapText(de.disclaimer, 108)) {
    drawText(buf, MARGIN_X, hintY, 'F1', 8, line, COLOR_MUTED);
    hintY -= 11;
  }
  return y - 60;
}

/** Pagina 1 del PDF completo (Pro): todas las entradas y las cuatro columnas de resultados. */
function renderFullPage(buf: ByteBuffer, request: CalculateRequest, response: CalculateResponse, de: PdfSchema): void {
  let y = drawHeader(buf, de, response.tableYear);

  y = drawSectionTitle(buf, y, de.sectionInputs);
  y += 8;
  for (const [label, value] of buildInputRows(request, de)) {
    drawText(buf, MARGIN_X, y, 'F1', 9.5, label, COLOR_MUTED);
    drawText(buf, MARGIN_X + 235, y, 'F2', 9.5, value, COLOR_TEXT);
    y -= 15.5;
  }
  y -= 14;

  y = drawSectionTitle(buf, y, de.sectionResult);
  y += 6;

  const labelColW = 150;
  const numColW = (CONTENT_W - labelColW) / 4;
  const colRightX = [0, 1, 2, 3].map((i) => MARGIN_X + labelColW + numColW * (i + 1) - 6);
  const columnTitles = [de.columns.recurring, de.columns.thirteenth, de.columns.fourteenth, de.columns.annual];
  columnTitles.forEach((title, i) => drawTextRight(buf, colRightX[i], y, 'F4', 8.5, title, COLOR_MUTED));
  y -= 8;
  drawLine(buf, MARGIN_X, y, PAGE_W - MARGIN_X, y, COLOR_BORDER);
  y -= 17;

  const rowDefs: Array<{ key: keyof PaymentBreakdown; label: string; deduction?: boolean }> = [
    { key: 'gross', label: de.rows.gross },
    { key: 'socialInsurance', label: de.rows.socialInsurance, deduction: true },
    { key: 'incomeTax', label: de.rows.incomeTax, deduction: true },
  ];
  const breakdowns = [response.recurring, response.thirteenth, response.fourteenth, response.annual];

  for (const row of rowDefs) {
    drawText(buf, MARGIN_X, y, 'F1', 9.5, row.label, COLOR_TEXT);
    breakdowns.forEach((b, i) => {
      const amount = formatOfficialEuro(b[row.key]);
      drawTextRight(buf, colRightX[i], y, 'F3', 9.5, row.deduction ? `- ${amount}` : amount, row.deduction ? COLOR_MUTED : COLOR_TEXT);
    });
    y -= 16.5;
  }

  y -= 4;
  fillRect(buf, MARGIN_X - 8, y - 6, CONTENT_W + 16, 24, COLOR_SUCCESS_TINT);
  drawText(buf, MARGIN_X, y + 2, 'F2', 10.5, de.rows.net, COLOR_SUCCESS);
  breakdowns.forEach((b, i) => drawTextRight(buf, colRightX[i], y + 2, 'F4', 10.5, formatOfficialEuro(b.net), COLOR_SUCCESS));
  y -= 40;

  drawDisclaimer(buf, de, y);
}

/**
 * Pagina unica del PDF Basico (gratis): resumen del resultado, datos basicos y un desglose
 * general (laufend / Jahresbezug) sin el detalle, mas un aviso para pasarse a Pro.
 */
function renderBasicPage(
  buf: ByteBuffer,
  request: CalculateRequest,
  response: CalculateResponse,
  de: PdfSchema,
  extra: PdfExtra,
): void {
  let y = drawHeader(buf, de, response.tableYear);

  y = drawSectionTitle(buf, y, extra.basicSummary);
  y += 6;
  fillRect(buf, MARGIN_X - 8, y - 52, CONTENT_W + 16, 66, COLOR_SUCCESS_TINT);
  drawText(buf, MARGIN_X, y - 8, 'F2', 10.5, extra.basicNetLabel, COLOR_SUCCESS);
  drawTextRight(buf, PAGE_W - MARGIN_X, y - 12, 'F4', 20, formatOfficialEuro(response.recurring.net), COLOR_SUCCESS);
  drawText(buf, MARGIN_X, y - 38, 'F1', 9.5, extra.basicAnnualNet, COLOR_MUTED);
  drawTextRight(buf, PAGE_W - MARGIN_X, y - 38, 'F3', 9.5, formatOfficialEuro(response.annual.net), COLOR_MUTED);
  y -= 84;

  y = drawSectionTitle(buf, y, extra.basicInputs);
  y += 8;
  const basicRows: Array<[string, string]> = [
    [de.labels.employment, de.employment[request.employmentType]],
    [de.labels.gross, `${formatOfficialEuro(request.grossAmount)} (${de.incomePeriod[request.incomePeriod]})`],
    [de.labels.state, de.states[request.state]],
  ];
  for (const [label, value] of basicRows) {
    drawText(buf, MARGIN_X, y, 'F1', 9.5, label, COLOR_MUTED);
    drawText(buf, MARGIN_X + 235, y, 'F2', 9.5, value, COLOR_TEXT);
    y -= 15.5;
  }
  y -= 14;

  y = drawSectionTitle(buf, y, extra.basicOverview);
  y += 6;
  const labelColW = 260;
  const numColW = (CONTENT_W - labelColW) / 2;
  const colRightX = [0, 1].map((i) => MARGIN_X + labelColW + numColW * (i + 1) - 6);
  drawTextRight(buf, colRightX[0], y, 'F4', 8.5, de.columns.recurring, COLOR_MUTED);
  drawTextRight(buf, colRightX[1], y, 'F4', 8.5, de.columns.annual, COLOR_MUTED);
  y -= 8;
  drawLine(buf, MARGIN_X, y, PAGE_W - MARGIN_X, y, COLOR_BORDER);
  y -= 17;

  const rows: Array<{ key: keyof PaymentBreakdown; label: string; deduction?: boolean }> = [
    { key: 'gross', label: de.rows.gross },
    { key: 'socialInsurance', label: de.rows.socialInsurance, deduction: true },
    { key: 'incomeTax', label: de.rows.incomeTax, deduction: true },
  ];
  for (const row of rows) {
    drawText(buf, MARGIN_X, y, 'F1', 9.5, row.label, COLOR_TEXT);
    [response.recurring, response.annual].forEach((b, i) => {
      const amount = formatOfficialEuro(b[row.key]);
      drawTextRight(buf, colRightX[i], y, 'F3', 9.5, row.deduction ? `- ${amount}` : amount, row.deduction ? COLOR_MUTED : COLOR_TEXT);
    });
    y -= 16.5;
  }
  y -= 4;
  fillRect(buf, MARGIN_X - 8, y - 6, CONTENT_W + 16, 24, COLOR_SUCCESS_TINT);
  drawText(buf, MARGIN_X, y + 2, 'F2', 10.5, de.rows.net, COLOR_SUCCESS);
  [response.recurring, response.annual].forEach((b, i) =>
    drawTextRight(buf, colRightX[i], y + 2, 'F4', 10.5, formatOfficialEuro(b.net), COLOR_SUCCESS),
  );
  y -= 40;

  drawDisclaimer(buf, de, y);

  // Aviso de mejora a Pro: sin enlace ni precio (la version de Google Play no vende suscripciones).
  const bannerY = 150;
  fillRect(buf, MARGIN_X - 8, bannerY - 46, CONTENT_W + 16, 70, COLOR_BRAND);
  drawText(buf, MARGIN_X + 6, bannerY, 'F2', 13, extra.upgradeTitle, COLOR_WHITE);
  let bodyY = bannerY - 20;
  for (const line of wrapText(extra.upgradeBody, 88)) {
    drawText(buf, MARGIN_X + 6, bodyY, 'F1', 9.5, line, COLOR_WHITE);
    bodyY -= 13;
  }
}

function fillVars(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

/** Lo que el usuario marco y se tuvo en cuenta (sin importes: el motor solo devuelve totales). */
export function buildAppliedLines(request: CalculateRequest, extra: PdfExtra): string[] {
  const lines: string[] = [];
  const a = extra.applied;
  if (request.soleEarnerDeduction) lines.push(a.soleEarner);
  if (request.familyBonus === 'full') lines.push(a.familyBonusFull);
  if (request.familyBonus === 'shared') lines.push(a.familyBonusShared);
  if (request.childrenUnder18 > 0 || request.childrenOver18WithFamilyAllowance > 0) {
    lines.push(
      fillVars(a.children, { u18: request.childrenUnder18, o18: request.childrenOver18WithFamilyAllowance }),
    );
  }
  if (!request.benefitInKindFromCompanyCar && request.commuteOneWayKm > 0) {
    lines.push(fillVars(a.commute, { km: request.commuteOneWayKm }));
  }
  if (request.taxFreeAllowanceMonthly > 0) {
    lines.push(fillVars(a.allowance, { amount: formatOfficialEuro(request.taxFreeAllowanceMonthly) }));
  }
  if (request.benefitInKindMonthly > 0) {
    lines.push(fillVars(a.benefitInKind, { amount: formatOfficialEuro(request.benefitInKindMonthly) }));
  }
  if (request.benefitInKindFromCompanyCar) lines.push(a.companyCar);
  return lines;
}

/** Paginas de explicaciones, consejos y guia del PDF completo. Reparte el texto en las paginas que hagan falta. */
function renderExtraPages(
  request: CalculateRequest,
  response: CalculateResponse,
  de: PdfSchema,
  extra: PdfExtra,
): ByteBuffer[] {
  const pages: ByteBuffer[] = [];
  let buf = new ByteBuffer();
  let y = 0;

  const newPage = () => {
    buf = new ByteBuffer();
    pages.push(buf);
    y = drawHeader(buf, de, response.tableYear);
  };
  const ensure = (needed: number) => {
    if (y - needed < 62) newPage();
  };
  const heading = (title: string) => {
    ensure(70);
    y = drawSectionTitle(buf, y, title);
  };
  const paragraph = (text: string, opts: { indent?: number; bullet?: string; muted?: boolean; size?: number } = {}) => {
    const indent = opts.indent ?? 0;
    const lines = wrapText(text, 96 - Math.round(indent / 5));
    lines.forEach((line, index) => {
      ensure(14);
      if (opts.bullet && index === 0) {
        drawText(buf, MARGIN_X, y, 'F1', 9.5, opts.bullet, COLOR_BRAND);
      }
      drawText(buf, MARGIN_X + indent, y, 'F1', opts.size ?? 9.5, line, opts.muted ? COLOR_MUTED : COLOR_TEXT);
      y -= 13.5;
    });
    y -= 4;
  };

  newPage();

  heading(extra.appliedTitle);
  const applied = buildAppliedLines(request, extra);
  if (applied.length === 0) {
    paragraph(extra.appliedNone, { muted: true });
  } else {
    applied.forEach((line) => paragraph(line, { indent: 12, bullet: '-' }));
  }
  y -= 8;

  heading(extra.explainTitle);
  for (const item of extra.explain) {
    ensure(46);
    drawText(buf, MARGIN_X, y, 'F2', 10, item.heading, COLOR_TEXT);
    y -= 14;
    paragraph(item.text, { muted: true });
  }
  y -= 4;

  heading(extra.tipsTitle);
  paragraph(extra.tipsIntro, { muted: true, size: 9 });
  buildTips(request, extra).forEach((tip) => paragraph(tip, { indent: 12, bullet: '-' }));
  y -= 8;

  heading(extra.guideTitle);
  extra.guide.forEach((step, index) => paragraph(step, { indent: 16, bullet: `${index + 1}.` }));
  ensure(60);
  paragraph(extra.guideNote, { muted: true, size: 8 });

  return pages;
}

/**
 * Exporta el PDF de un calculo. 'basic' (gratis): una pagina con el resumen y un aviso para pasarse
 * a Pro. 'pro': el informe completo, con explicaciones, consejos y guia de presentacion.
 */
export function exportOfficialCalculationPdf(
  request: CalculateRequest,
  response: CalculateResponse,
  lang: Lang = 'de',
  tier: PdfTier = 'pro',
): void {
  const blob = buildOfficialCalculationPdf(request, response, lang, tier);
  const datePart = formatOfficialDate(new Date()).replace(/\./g, '-');
  const suffix = tier === 'basic' ? '-Basis' : '';
  downloadBlob(blob, `${getPdfSchema(lang).productName}-Berechnung-${lang}-${datePart}${suffix}.pdf`);
}

/** Construye el PDF sin descargarlo (los tests lo usan). */
export function buildOfficialCalculationPdf(
  request: CalculateRequest,
  response: CalculateResponse,
  lang: Lang = 'de',
  tier: PdfTier = 'pro',
): Blob {
  const de = getPdfSchema(lang);
  const extra = getPdfExtra(lang);

  const pages: ByteBuffer[] = [];
  const first = new ByteBuffer();
  pages.push(first);
  if (tier === 'basic') {
    renderBasicPage(first, request, response, de, extra);
  } else {
    renderFullPage(first, request, response, de);
    pages.push(...renderExtraPages(request, response, de, extra));
  }

  pages.forEach((page, index) => drawFooter(page, de, extra, index + 1, pages.length));
  return assemblePdf(pages);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
