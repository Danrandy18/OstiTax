import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

type Step = 'email' | 'code' | 'sent' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      <h1>{{ 'authForgotPasswordTitle' | translate }}</h1>
      @switch (step()) {
        @case ('sent') {
          <p>{{ 'authForgotPasswordSuccess' | translate }}</p>
        }
        @case ('done') {
          <p>{{ 'authResetPasswordSuccess' | translate }}</p>
        }
        @case ('code') {
          <p>{{ 'authResetCodeBody' | translate }}</p>
          <form (ngSubmit)="submitCode()" class="forgot-form">
            <input
              type="text"
              name="code"
              required
              autocomplete="one-time-code"
              autocapitalize="characters"
              spellcheck="false"
              [ngModel]="code()"
              (ngModelChange)="code.set($event)"
              [placeholder]="'authResetCodeLabel' | translate"
            />
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
              <p class="error-text" role="alert">{{ error() }}</p>
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
        @default {
          <p>{{ 'authForgotPasswordBody' | translate }}</p>
          <form (ngSubmit)="submit()" class="forgot-form">
            <input
              type="email"
              name="email"
              required
              autocomplete="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              [placeholder]="'authEmailLabel' | translate"
            />
            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                {{ 'loading' | translate }}
              } @else {
                {{ 'authForgotPasswordButton' | translate }}
              }
            </button>
          </form>
        }
      }
      <a routerLink="/" class="back-link">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly code = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly step = signal<Step>('email');

  submit(): void {
    this.loading.set(true);
    this.auth.forgotPassword(this.email().trim()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.step.set(response.mode === 'code' ? 'code' : 'sent');
      },
      error: () => {
        this.loading.set(false);
        this.step.set('sent');
      },
    });
  }

  submitCode(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .resetPasswordWithCode(this.email().trim(), this.code().trim(), this.password())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.step.set('done');
          setTimeout(() => void this.router.navigateByUrl('/'), 2500);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(this.i18n.t().authResetCodeInvalid);
        },
      });
  }
}
