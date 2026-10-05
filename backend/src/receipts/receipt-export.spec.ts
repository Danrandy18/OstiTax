import {
  buildReceiptsCsv,
  buildReceiptsPdf,
  formatDate,
  summarize,
  type ExportableReceipt,
} from './receipt-export';

const base: ExportableReceipt = {
  merchant: 'ÖBB Personenverkehr AG',
  date: '2026-06-21',
  total: 27.9,
  vatRate: 10,
  vatAmount: 2.54,
  documentNumber: 'R-123',
  category: 'travel',
  depreciation: false,
};

const receipts: ExportableReceipt[] = [
  base,
  {
    ...base,
    merchant: 'MediaMarkt',
    total: 1299,
    vatRate: 20,
    vatAmount: 216.5,
    category: 'workEquipment',
    depreciation: true,
  },
  { ...base, merchant: 'Thalia', total: 0.1, category: 'workEquipment' },
  { ...base, merchant: 'Thalia', total: 0.2, category: 'workEquipment' },
];

describe('receipt-export', () => {
  it('suma por categoria sin errores de coma flotante', () => {
    const { categories, total } = summarize(receipts);
    const work = categories.find((c) => c.category === 'workEquipment')!;
    expect(work.total).toBe(1299.3);
    expect(work.l1Code).toBe('719');
    expect(categories.map((c) => c.category)).toEqual([
      'workEquipment',
      'travel',
    ]);
    expect(total).toBe(1327.2);
  });

  it('formatea fechas al estilo austriaco', () => {
    expect(formatDate('2026-06-21')).toBe('21.06.2026');
    expect(formatDate(null)).toBe('–');
  });

  it('CSV con punto y coma, coma decimal y BOM', () => {
    const csv = buildReceiptsCsv([base]);
    expect(csv.startsWith('﻿')).toBe(true);
    const [header, row] = csv.slice(1).trim().split('\r\n');
    expect(header.split(';')[0]).toBe('Datum');
    expect(row).toBe(
      '21.06.2026;ÖBB Personenverkehr AG;Reisekosten;721;R-123;10;2,54;27,90;nein',
    );
  });

  it('CSV neutraliza formulas y escapa separadores', () => {
    const csv = buildReceiptsCsv([
      { ...base, merchant: '=HYPERLINK("x")', documentNumber: 'A;B' },
    ]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"A;B"');
  });

  it('genera un PDF valido, tambien con muchas paginas y sin recibos', async () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      ...base,
      documentNumber: `R-${i}`,
    }));
    for (const list of [many, []]) {
      const pdf = await buildReceiptsPdf(list, { year: 2026 });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.length).toBeGreaterThan(1000);
    }
  });
});
