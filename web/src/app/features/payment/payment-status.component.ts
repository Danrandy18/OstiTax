import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, exhaustMap, of, take, takeWhile, timer } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 16;

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
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  readonly refreshing = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.auth.token()) {
      this.refreshing.set(false);
      return;
    }

    // El proveedor redirige antes de que su webhook llegue al backend: pro se activa unos segundos
    // despues. Se consulta hasta ver isPro (o agotar el tiempo) en vez de una sola vez.
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        take(POLL_MAX_ATTEMPTS),
        exhaustMap(() => this.auth.refreshAccount().pipe(catchError(() => of(null)))),
        takeWhile((account) => !account?.isPro, true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ complete: () => this.refreshing.set(false) });
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
