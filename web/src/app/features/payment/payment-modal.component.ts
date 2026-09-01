import {
  Component,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BillingApiService } from '../../core/services/billing-api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';
import type { PlanInterval } from '../../core/models/api.models';

type TranslationKey = keyof ReturnType<I18nService['t']>;
type PayMethod = 'card' | 'paypal';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.scss',
})
export class PaymentModalComponent {
  private readonly billingApi = inject(BillingApiService);
  readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly loading = signal<PayMethod | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedInterval = signal<PlanInterval>('monthly');
  readonly selectedMethod = signal<PayMethod>('card');

  readonly plans: {
    value: PlanInterval;
    titleKey: TranslationKey;
    priceKey: TranslationKey;
    perMonthKey?: TranslationKey;
    badgeKey?: TranslationKey;
    benefitKey: TranslationKey;
    highlight: boolean;
  }[] = [
    {
      value: 'monthly',
      titleKey: 'planMonthlyTitle',
      priceKey: 'planMonthlyPrice',
      benefitKey: 'planMonthlyBenefit',
      highlight: false,
    },
    {
      value: 'semiannual',
      titleKey: 'planSemiannualTitle',
      priceKey: 'planSemiannualPrice',
      perMonthKey: 'planSemiannualPerMonth',
      badgeKey: 'planSemiannualBadge',
      benefitKey: 'planSemiannualBenefit',
      highlight: false,
    },
    {
      value: 'annual',
      titleKey: 'planAnnualTitle',
      priceKey: 'planAnnualPrice',
      perMonthKey: 'planAnnualPerMonth',
      badgeKey: 'planAnnualBadge',
      benefitKey: 'planAnnualBenefit',
      highlight: true,
    },
  ];

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  close(): void {
    if (this.loading()) {
      return;
    }
    this.error.set(null);
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  selectPlan(interval: PlanInterval): void {
    this.selectedInterval.set(interval);
  }

  selectMethod(method: PayMethod): void {
    this.selectedMethod.set(method);
  }

  pay(): void {
    if (this.selectedMethod() === 'card') {
      this.payWithStripe();
    } else {
      this.payWithPaypal();
    }
  }

  private payWithStripe(): void {
    this.error.set(null);
    this.loading.set('card');
    this.billingApi.createStripeCheckout(this.selectedInterval()).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: () => {
        this.loading.set(null);
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  private payWithPaypal(): void {
    this.error.set(null);
    this.loading.set('paypal');
    this.billingApi
      .createPaypalSubscription(this.selectedInterval())
      .subscribe({
        next: ({ approvalUrl }) => {
          window.location.href = approvalUrl;
        },
        error: () => {
          this.loading.set(null);
          this.error.set(this.i18n.t().errorGeneric);
        },
      });
  }
}
