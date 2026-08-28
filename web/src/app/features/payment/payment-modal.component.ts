import {
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BillingApiService } from '../../core/services/billing-api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

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

  readonly loading = signal<'stripe' | 'paypal' | null>(null);
  readonly error = signal<string | null>(null);

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

  payWithStripe(): void {
    this.error.set(null);
    this.loading.set('stripe');
    this.billingApi.createStripeCheckout().subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: () => {
        this.loading.set(null);
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  payWithPaypal(): void {
    this.error.set(null);
    this.loading.set('paypal');
    this.billingApi.createPaypalSubscription().subscribe({
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
