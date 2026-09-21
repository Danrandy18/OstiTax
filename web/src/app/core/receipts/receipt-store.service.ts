import { Injectable, computed, signal } from '@angular/core';
import type { StoredReceipt } from './receipt.models';

const STORAGE_KEY = 'ostitax_receipts_v1';

/** Recibos guardados solo en el navegador (localStorage). Nada sale del dispositivo. */
@Injectable({ providedIn: 'root' })
export class ReceiptStoreService {
  readonly receipts = signal<StoredReceipt[]>(this.load());

  /** Suma de los recibos por ano y categoria, para el total anual. */
  readonly totalsByYear = computed(() => {
    const totals = new Map<string, number>();
    for (const r of this.receipts()) {
      if (r.total == null) continue;
      const year = r.date.slice(0, 4) || String(new Date(r.createdAt).getFullYear());
      totals.set(year, (totals.get(year) ?? 0) + r.total);
    }
    return [...totals.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  });

  add(receipt: StoredReceipt): boolean {
    return this.persist([receipt, ...this.receipts()]);
  }

  remove(id: string): void {
    this.persist(this.receipts().filter((r) => r.id !== id));
  }

  exportJson(): string {
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), receipts: this.receipts().map((r) => ({ ...r, thumbnail: undefined })) },
      null,
      2,
    );
  }

  private persist(next: StoredReceipt[]): boolean {
    this.receipts.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }

  private load(): StoredReceipt[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as StoredReceipt[]) : [];
    } catch {
      return [];
    }
  }
}
