import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      @if (!token) {
        <h1>{{ 'authResetPasswordTitle' | translate }}</h1>
        <p class="error-text">{{ 'authResetPasswordInvalidToken' | translate }}</p>
      } @else if (done()) {
        <h1>{{ 'authResetPasswordTitle' | translate }}</h1>
        <p>{{ 'authResetPasswordSuccess' | translate }}</p>
      } @else {
        <h1>{{ 'authResetPasswordTitle' | translate }}</h1>
        <form (ngSubmit)="submit()" class="forgot-form">
          <input
            type="password"
            name="password"
            required
            minlength="8"
            autocomplete="new-password"
            [ngModel]="password()"
            (ngModelChange)="password.set($event)"
            [placeholder]="'authNewPasswordLabel' | translate"
          />
          @if (error()) {
            <p class="error-text">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              {{ 'loading' | translate }}
            } @else {
              {{ 'authResetPasswordButton' | translate }}
            }
          </button>
        </form>
      }
      <a routerLink="/" class="back-link">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './forgot-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = this.route.snapshot.queryParamMap.get('token');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.token) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.resetPassword(this.token, this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => void this.router.navigateByUrl('/'), 2500);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t().authResetPasswordInvalidToken);
      },
    });
  }
}
