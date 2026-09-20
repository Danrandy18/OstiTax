import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="status-page card status-success">
      <svg class="icon icon-lg status-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.5 2.5L16 9.5" />
      </svg>
      <h1>{{ 'paymentSuccessTitle' | translate }}</h1>
      @if (auth.account()?.isPro) {
        <p>{{ 'paymentSuccessBody' | translate }}</p>
      } @else if (auth.activatingPro()) {
        <p>{{ 'loading' | translate }}</p>
      }
      <a routerLink="/" class="btn-primary">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './payment-status.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  protected readonly auth = inject(AuthService);

  ngOnInit(): void {
    void this.auth.ensureAuth().then(() => this.auth.pollUntilPro());
  }
}

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="status-page card status-cancel">
      <svg class="icon icon-lg status-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
      <h1>{{ 'paymentCancelTitle' | translate }}</h1>
      <p>{{ 'paymentCancelBody' | translate }}</p>
      <a routerLink="/" class="btn-primary">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './payment-status.component.scss',
})
export class PaymentCancelComponent {}
