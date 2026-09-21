import { RECEIPTS_TEXT } from './receipts-i18n';
import { ReceiptStoreService } from './receipt-store.service';
import type { StoredReceipt } from './receipt.models';

const sample = (over: Partial<StoredReceipt> = {}): StoredReceipt => ({
  id: 'a',
  createdAt: '2026-01-01T00:00:00Z',
  merchant: 'Shop',
  date: '2026-03-03',
  total: 10,
  vatRate: 20,
  vatAmount: 1.67,
  documentNumber: '1',
  category: 'other',
  depreciation: false,
  thumbnail: 'data:x',
  ...over,
});

describe('receipts i18n', () => {
  it('los 6 idiomas tienen las mismas claves', () => {
    const keys = (o: object): string[] =>
      Object.entries(o)
        .flatMap(([k, v]) => (typeof v === 'object' ? keys(v).map((s) => `${k}.${s}`) : [k]))
        .sort();
    const de = keys(RECEIPTS_TEXT.de);
    for (const lang of ['en', 'es', 'tr', 'bcs', 'uk'] as const) {
      expect(keys(RECEIPTS_TEXT[lang])).toEqual(de);
    }
  });
});

describe('ReceiptStoreService', () => {
  beforeEach(() => localStorage.clear());

  it('guarda, suma por ano y exporta sin miniaturas', () => {
    const store = new ReceiptStoreService();
    expect(store.add(sample())).toBe(true);
    store.add(sample({ id: 'b', total: 5.5 }));
    expect(store.totalsByYear()).toEqual([['2026', 15.5]]);
    expect(JSON.parse(store.exportJson()).receipts[0].thumbnail).toBeUndefined();
    store.remove('a');
    expect(store.receipts().length).toBe(1);
    expect(new ReceiptStoreService().receipts().length).toBe(1);
  });
});
