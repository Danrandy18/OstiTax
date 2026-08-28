import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      <h1>{{ 'paymentSuccessTitle' | translate }}</h1>
      <p>{{ 'paymentSuccessBody' | translate }}</p>
      @if (refreshing()) {
        <p>{{ 'loading' | translate }}</p>
      }
      <a routerLink="/" class="btn-primary">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './payment-status.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  private readonly session = inject(SessionService);
  readonly refreshing = signal(true);

  ngOnInit(): void {
    this.session.refreshStatus().subscribe({
      complete: () => this.refreshing.set(false),
      error: () => this.refreshing.set(false),
    });
  }
}

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      <h1>{{ 'paymentCancelTitle' | translate }}</h1>
      <p>{{ 'paymentCancelBody' | translate }}</p>
      <a routerLink="/" class="btn-primary">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './payment-status.component.scss',
})
export class PaymentCancelComponent {}
