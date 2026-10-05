import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LegacyStoredReceipt, Receipt, ReceiptInput } from './receipt.models';
import { ReceiptsApiService } from './receipts-api.service';

/** Clave de la Fase 1, cuando los recibos vivian solo en el navegador. */
const LEGACY_KEY = 'ostitax_receipts_v1';
/** Miniaturas por id de recibo: se quedan en este navegador, nunca se suben. */
const THUMBS_KEY = 'ostitax_receipt_thumbs_v1';

/**
 * Recibos guardados en la cuenta (visibles en web y app). Las miniaturas son solo una ayuda
 * visual local; el servidor guarda unicamente los datos revisados por el usuario.
 */
@Injectable({ providedIn: 'root' })
export class ReceiptStoreService {
  private readonly api = inject(ReceiptsApiService);

  readonly receipts = signal<Receipt[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  private readonly thumbs = signal<Record<string, string>>(readJson(THUMBS_KEY, {}));
  readonly legacy = signal<LegacyStoredReceipt[]>(readLegacy());

  /** Suma de los recibos por ano, del mas reciente al mas antiguo. */
  readonly totalsByYear = computed(() => {
    const cents = new Map<string, number>();
    for (const r of this.receipts()) {
      if (r.total == null) continue;
      const year = r.date?.slice(0, 4) || r.createdAt.slice(0, 4);
      cents.set(year, (cents.get(year) ?? 0) + Math.round(r.total * 100));
    }
    return [...cents.entries()]
      .map(([year, c]) => [year, c / 100] as [string, number])
      .sort((a, b) => b[0].localeCompare(a[0]));
  });

  thumbnail(id: string): string | null {
    return this.thumbs()[id] ?? null;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.receipts.set(await firstValueFrom(this.api.list()));
      this.loaded.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async add(input: ReceiptInput, thumbnail: string | null): Promise<Receipt> {
    const saved = await firstValueFrom(this.api.create(input));
    this.receipts.update((list) => sortReceipts([saved, ...list]));
    if (thumbnail) this.setThumbs({ ...this.thumbs(), [saved.id]: thumbnail });
    return saved;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.api.remove(id));
    this.receipts.update((list) => list.filter((r) => r.id !== id));
    const { [id]: _removed, ...rest } = this.thumbs();
    this.setThumbs(rest);
  }

  async removeAll(): Promise<void> {
    await firstValueFrom(this.api.removeAll());
    this.receipts.set([]);
    this.setThumbs({});
  }

  /** Sube a la cuenta los recibos de la Fase 1 y los borra del navegador. */
  async uploadLegacy(): Promise<number> {
    const legacy = this.legacy();
    if (legacy.length === 0) return 0;
    const { imported } = await firstValueFrom(
      this.api.import(
        legacy.map((r) => ({
          merchant: r.merchant,
          date: r.date || null,
          total: r.total,
          vatRate: r.vatRate,
          vatAmount: r.vatAmount,
          documentNumber: r.documentNumber,
          category: r.category,
        })),
      ),
    );
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Sin localStorage (SSR o navegador restringido) no hay nada que limpiar.
    }
    this.legacy.set([]);
    await this.load();
    return imported;
  }

  private setThumbs(next: Record<string, string>): void {
    this.thumbs.set(next);
    try {
      localStorage.setItem(THUMBS_KEY, JSON.stringify(next));
    } catch {
      // Las miniaturas son opcionales: si el almacenamiento esta lleno, se omiten.
    }
  }
}

function sortReceipts(list: Receipt[]): Receipt[] {
  return [...list].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLegacy(): LegacyStoredReceipt[] {
  const parsed = readJson<unknown>(LEGACY_KEY, []);
  return Array.isArray(parsed) ? (parsed as LegacyStoredReceipt[]) : [];
}
