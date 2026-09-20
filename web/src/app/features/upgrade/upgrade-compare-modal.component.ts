import { NgTemplateOutlet } from '@angular/common';
import { Component, HostListener, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

type TranslationKey = keyof ReturnType<I18nService['t']>;

type Cell =
  { kind: 'text'; key: TranslationKey } | { kind: 'yes' } | { kind: 'no' } | { kind: 'soon' };

interface CompareRow {
  labelKey: TranslationKey;
  free: Cell;
  pro: Cell;
}

/** Comparativa Gratis vs Pro. Solo se listan como disponibles funciones que existen de verdad. */
@Component({
  selector: 'app-upgrade-compare-modal',
  standalone: true,
  imports: [NgTemplateOutlet, TranslatePipe],
  templateUrl: './upgrade-compare-modal.component.html',
  styleUrl: './upgrade-compare-modal.component.scss',
})
export class UpgradeCompareModalComponent {
  readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly choosePlan = output<void>();
  readonly login = output<void>();

  readonly rows: CompareRow[] = [
    {
      labelKey: 'compareRowCalcs',
      free: { kind: 'text', key: 'compareCalcsFree' },
      pro: { kind: 'text', key: 'compareCalcsPro' },
    },
    { labelKey: 'compareRowPdf', free: { kind: 'no' }, pro: { kind: 'yes' } },
    { labelKey: 'compareRowAccount', free: { kind: 'no' }, pro: { kind: 'yes' } },
    { labelKey: 'compareRowOcr', free: { kind: 'no' }, pro: { kind: 'soon' } },
  ];

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }
}
