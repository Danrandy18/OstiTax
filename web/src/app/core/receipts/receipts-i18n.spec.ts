import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RECEIPTS_TEXT } from './receipts-i18n';
import { ReceiptStoreService } from './receipt-store.service';
import type { LegacyStoredReceipt, Receipt, ReceiptInput } from './receipt.models';
import { ReceiptsApiService } from './receipts-api.service';

const input = (over: Partial<ReceiptInput> = {}): ReceiptInput => ({
  merchant: 'Shop',
  date: '2026-03-03',
  total: 10,
  vatRate: 20,
  vatAmount: 1.67,
  documentNumber: '1',
  category: 'other',
  ...over,
});

const saved = (id: string, over: Partial<ReceiptInput> = {}): Receipt => ({
  ...input(over),
  id,
  createdAt: '2026-01-01T00:00:00Z',
  depreciation: false,
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
  let api: Record<string, ReturnType<typeof vi.fn>>;

  function setup(): ReceiptStoreService {
    TestBed.configureTestingModule({ providers: [{ provide: ReceiptsApiService, useValue: api }] });
    return TestBed.inject(ReceiptStoreService);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    api = {
      list: vi.fn(() => of([saved('a'), saved('old', { date: '2025-05-05', total: 4 })])),
      create: vi.fn((body: ReceiptInput) => of(saved('new', body))),
      remove: vi.fn(() => of(undefined)),
      removeAll: vi.fn(() => of(undefined)),
      import: vi.fn((list: ReceiptInput[]) => of({ imported: list.length })),
    };
  });

  it('carga de la cuenta y suma por ano en centimos', async () => {
    const store = setup();
    await store.load();
    await store.add(input({ total: 0.1 }), null);
    await store.add(input({ total: 0.2 }), null);
    expect(store.totalsByYear()).toEqual([
      ['2026', 10.3],
      ['2025', 4],
    ]);
  });

  it('la miniatura se queda en el navegador y no se envia al servidor', async () => {
    const store = setup();
    await store.add(input(), 'data:image/jpeg;base64,xx');
    expect(api['create'].mock.calls[0][0]).not.toHaveProperty('thumbnail');
    expect(store.thumbnail('new')).toBe('data:image/jpeg;base64,xx');

    await store.remove('new');
    expect(store.thumbnail('new')).toBeNull();
    expect(store.receipts().some((r) => r.id === 'new')).toBe(false);
  });

  it('sube los recibos antiguos del navegador y los borra de alli', async () => {
    const legacy: LegacyStoredReceipt[] = [
      { ...saved('l1'), date: '', thumbnail: 'data:x' },
    ];
    localStorage.setItem('ostitax_receipts_v1', JSON.stringify(legacy));
    const store = setup();
    expect(store.legacy().length).toBe(1);

    expect(await store.uploadLegacy()).toBe(1);
    const sent = api['import'].mock.calls[0][0] as ReceiptInput[];
    expect(sent[0]).toEqual({ ...input(), date: null });
    expect(localStorage.getItem('ostitax_receipts_v1')).toBeNull();
    expect(store.legacy()).toEqual([]);
  });
});
