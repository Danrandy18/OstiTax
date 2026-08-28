import type {
  CalculateRequest,
  CalculateResponse,
  PaymentBreakdown,
} from '../models/api.models';
import {
  PDF_OFFICIAL_DE,
  formatOfficialDate,
  formatOfficialEuro,
} from './pdf-official-de';

/** Generador PDF mínimo sin dependencias externas (texto Helvetica). */
export function buildTextPdfBlob(lines: readonly string[]): Blob {
  const sanitized = lines.map((line) =>
    line.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?'),
  );
  const contentLines = ['BT', '/F1 10 Tf', '14 820 Td', '14 TL'];

  for (const line of sanitized) {
    contentLines.push(`(${escapePdfText(line)}) Tj`, 'T*');
  }

  contentLines.push('ET');
  const contentStream = `${contentLines.join('\n')}\n`;
  const contentLength = new TextEncoder().encode(contentStream).length;

  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj',
    `4 0 obj<< /Length ${contentLength} >>stream\n${contentStream}endstream\nendobj`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function exportOfficialCalculationPdf(
  request: CalculateRequest,
  response: CalculateResponse,
): void {
  const blob = buildTextPdfBlob(buildOfficialLines(request, response));
  const datePart = formatOfficialDate(new Date()).replace(/\./g, '-');
  downloadBlob(blob, `NettoKlar-Berechnung-${datePart}.pdf`);
}

function buildOfficialLines(
  request: CalculateRequest,
  response: CalculateResponse,
): string[] {
  const de = PDF_OFFICIAL_DE;
  const lines: string[] = [
    de.productName,
    de.documentTitle,
    `${de.standPrefix}: ${response.tableYear}`,
    `${de.createdPrefix}: ${formatOfficialDate(new Date())}`,
    '',
    de.sectionInputs,
    `${de.labels.employment}: ${de.employment[request.employmentType]}`,
    `${de.labels.gross}: ${formatOfficialEuro(request.grossAmount)} (${de.incomePeriod[request.incomePeriod]})`,
    `${de.labels.state}: ${de.states[request.state]}`,
    `${de.labels.soleEarner}: ${request.soleEarnerDeduction ? de.yesNo.yes : de.yesNo.no}`,
    `${de.labels.familyBonus}: ${de.familyBonus[request.familyBonus]}`,
  ];

  if (
    request.soleEarnerDeduction ||
    request.familyBonus !== 'none' ||
    request.childrenUnder18 > 0 ||
    request.childrenOver18WithFamilyAllowance > 0
  ) {
    lines.push(
      `Kinder unter 18: ${request.childrenUnder18}`,
      `Kinder ueber 18 (Familienbeihilfe): ${request.childrenOver18WithFamilyAllowance}`,
    );
  }

  lines.push(
    `${de.labels.benefitInKind}: ${formatOfficialEuro(request.benefitInKindMonthly)}`,
    `${de.labels.companyCar}: ${request.benefitInKindFromCompanyCar ? de.yesNo.yes : de.yesNo.no}`,
  );

  if (request.benefitInKindFromCompanyCar && request.companyCar) {
    const car = request.companyCar;
    lines.push(
      `  Anschaffungswert: ${formatOfficialEuro(car.acquisitionCost)}`,
      `  CO2 (g/km): ${car.co2GramsPerKm}`,
      `  Erstzulassung: ${car.firstRegistrationYear}`,
      `  Halber Sachbezug: ${car.halfBenefit ? de.yesNo.yes : de.yesNo.no}`,
    );
  }

  lines.push(
    `${de.labels.taxFreeAllowance}: ${formatOfficialEuro(request.taxFreeAllowanceMonthly)}`,
  );

  if (!request.benefitInKindFromCompanyCar && request.commuteOneWayKm > 0) {
    lines.push(
      `${de.labels.commute}: ${request.commuteOneWayKm} km (einfache Strecke)`,
      `Oeffentlicher Verkehr zumutbar: ${request.publicTransportReasonable ? de.yesNo.yes : de.yesNo.no}`,
      `Pendeltage pro Monat: ${de.commuteDays[request.commuteDaysPerMonth]}`,
    );
  }

  lines.push('', de.sectionResult, buildResultsTable(response), '', de.disclaimer);
  return lines;
}

function buildResultsTable(response: CalculateResponse): string {
  const de = PDF_OFFICIAL_DE;
  const breakdowns = [
    response.recurring,
    response.thirteenth,
    response.fourteenth,
    response.annual,
  ];
  const cols = [
    de.columns.recurring,
    de.columns.thirteenth,
    de.columns.fourteenth,
    de.columns.annual,
  ];
  const header = `${''.padEnd(22)}${cols.map((c) => padCell(c, 14)).join('')}`;
  const tableLines = [header, '-'.repeat(78)];

  const rowKeys: Array<keyof PaymentBreakdown> = [
    'gross',
    'socialInsurance',
    'incomeTax',
    'net',
  ];
  const rowLabels = [
    de.rows.gross,
    de.rows.socialInsurance,
    de.rows.incomeTax,
    de.rows.net,
  ];

  for (let i = 0; i < rowKeys.length; i += 1) {
    const key = rowKeys[i];
    const cells = breakdowns.map((b) => formatOfficialEuro(b[key]));
    tableLines.push(
      `${rowLabels[i].padEnd(22)}${cells.map((c) => padCell(c, 14)).join('')}`,
    );
  }

  return tableLines.join('\n');
}

function padCell(value: string, width: number): string {
  return value.length >= width ? `${value.slice(0, width - 1)} ` : value.padStart(width);
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
