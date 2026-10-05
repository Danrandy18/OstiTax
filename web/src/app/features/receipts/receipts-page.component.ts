import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { OcrService } from '../../core/receipts/ocr.service';
import {
  RECEIPT_CATEGORIES,
  RECEIPT_VAT_RATES,
  type ParsedReceipt,
  type ReceiptCategory,
  type ReceiptExportFormat,
  type ReceiptVatRate,
} from '../../core/receipts/receipt.models';
import { ReceiptStoreService } from '../../core/receipts/receipt-store.service';
import { RECEIPTS_TEXT } from '../../core/receipts/receipts-i18n';
import { ReceiptsApiService } from '../../core/receipts/receipts-api.service';
import { AuthService } from '../../core/services/auth.service';
import { UpgradeService } from '../../core/services/upgrade.service';

type Step = 'idle' | 'reading' | 'analyzing' | 'review' | 'saving';

@Component({
  selector: 'app-receipts-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './receipts-page.component.html',
  styleUrl: './receipts-page.component.scss',
})
export class ReceiptsPageComponent implements OnDestroy {
  private readonly ocr = inject(OcrService);
  private readonly api = inject(ReceiptsApiService);
  private readonly i18n = inject(I18nService);
  readonly store = inject(ReceiptStoreService);
  readonly auth = inject(AuthService);
  readonly upgrade = inject(UpgradeService);

  readonly text = computed(() => RECEIPTS_TEXT[this.i18n.currentLang()]);
  readonly categories = RECEIPT_CATEGORIES;
  readonly vatRates = RECEIPT_VAT_RATES;

  readonly step = signal<Step>('idle');
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  readonly imageUrl = signal<string | null>(null);
  readonly zoomed = signal(false);
  readonly parsed = signal<ParsedReceipt | null>(null);
  readonly busy = signal(false);

  // Campos editables de la pantalla de revision.
  merchant = '';
  date = '';
  total: number | null = null;
  vatRate: ReceiptVatRate | null = null;
  vatAmount: number | null = null;
  documentNumber = '';
  category: ReceiptCategory = 'other';
  /** Ano del export; null = todos. */
  exportYear: number | null = null;

  private thumbnail: string | null = null;

  readonly isPro = computed(() => this.auth.account()?.isPro ?? false);

  /** Suma anual guardada: solo importes, sin decidir nada fiscal. */
  readonly totals = this.store.totalsByYear;
  readonly years = computed(() => this.totals().map(([year]) => Number(year)));
  readonly legacyText = computed(() =>
    this.text().legacyText.replace('{n}', String(this.store.legacy().length)),
  );

  constructor() {
    // Carga los recibos de la cuenta en cuanto hay sesion (tambien tras iniciarla aqui).
    effect(() => {
      const accountId = this.auth.account()?.id;
      if (!accountId) return;
      untracked(() => {
        void this.store.load().then(
          () => (this.exportYear ??= this.years()[0] ?? null),
          () => this.error.set(this.text().errorLoad),
        );
      });
    });
  }

  /** Aviso en pantalla: un bien de trabajo por encima del limite GWG se amortiza. */
  gwgApplies(): boolean {
    const gwg = this.parsed()?.gwgLimit ?? 1000;
    return this.category === 'workEquipment' && (this.total ?? 0) > gwg;
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set(null);
    this.releaseImage();
    this.imageUrl.set(URL.createObjectURL(file));
    this.zoomed.set(false);
    this.progress.set(0);
    this.step.set('reading');

    let ocrText: string;
    try {
      const result = await this.ocr.recognize(file, (p) => this.progress.set(p));
      ocrText = result.text;
      this.thumbnail = result.thumbnail;
    } catch {
      this.fail(this.text().errorOcr);
      return;
    }
    if (ocrText.trim().length < 3) {
      this.fail(this.text().errorOcr);
      return;
    }

    this.step.set('analyzing');
    this.api.parse(ocrText).subscribe({
      next: (parsed) => {
        this.parsed.set(parsed);
        this.merchant = parsed.merchant.value ?? '';
        this.date = parsed.date.value ?? '';
        this.total = parsed.total.value;
        this.vatRate = parsed.vat.rate;
        this.vatAmount = parsed.vat.amount;
        this.documentNumber = parsed.documentNumber.value ?? '';
        this.category = parsed.category;
        this.step.set('review');
      },
      error: (err: { status?: number }) => {
        if (err?.status === 403) this.upgrade.openCompare();
        this.fail(this.text().errorParse);
      },
    });
  }

  async save(): Promise<void> {
    this.error.set(null);
    this.step.set('saving');
    try {
      await this.store.add(
        {
          merchant: this.merchant.trim(),
          date: this.date || null,
          total: this.total,
          vatRate: this.vatRate,
          vatAmount: this.vatAmount,
          documentNumber: this.documentNumber.trim(),
          category: this.category,
        },
        this.thumbnail,
      );
      this.exportYear ??= this.years()[0] ?? null;
      this.reset();
    } catch {
      this.error.set(this.text().errorSave);
      this.step.set('review');
    }
  }

  discard(): void {
    this.reset();
  }

  async remove(id: string): Promise<void> {
    await this.run(() => this.store.remove(id), this.text().errorAction);
  }

  async removeAll(): Promise<void> {
    if (!confirm(this.text().removeAllConfirm)) return;
    await this.run(() => this.store.removeAll(), this.text().errorAction);
  }

  async uploadLegacy(): Promise<void> {
    await this.run(() => this.store.uploadLegacy(), this.text().errorSave);
  }

  async export(format: ReceiptExportFormat): Promise<void> {
    await this.run(async () => {
      const blob = await firstValueFrom(this.api.export(format, this.exportYear));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OestiTax-Belege${this.exportYear ? `-${this.exportYear}` : ''}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, this.text().errorExport);
  }

  warningText(code: string): string {
    return (this.text().warn as Record<string, string>)[code] ?? code;
  }

  categoryLabel(category: ReceiptCategory): string {
    return this.text().cat[category];
  }

  ngOnDestroy(): void {
    this.releaseImage();
  }

  private async run(action: () => Promise<unknown>, errorText: string): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      await action();
    } catch {
      this.error.set(errorText);
    } finally {
      this.busy.set(false);
    }
  }

  private fail(message: string): void {
    this.error.set(message);
    this.step.set('idle');
  }

  private reset(): void {
    this.step.set('idle');
    this.parsed.set(null);
    this.thumbnail = null;
    this.releaseImage();
  }

  private releaseImage(): void {
    const url = this.imageUrl();
    if (url) URL.revokeObjectURL(url);
    this.imageUrl.set(null);
  }
}
