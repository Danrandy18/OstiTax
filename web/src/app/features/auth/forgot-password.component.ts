import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      @if (sent()) {
        <h1>{{ 'authForgotPasswordTitle' | translate }}</h1>
        <p>{{ 'authForgotPasswordSuccess' | translate }}</p>
      } @else {
        <h1>{{ 'authForgotPasswordTitle' | translate }}</h1>
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
      <a routerLink="/" class="back-link">{{ 'backToCalculator' | translate }}</a>
    </section>
  `,
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  readonly email = signal('');
  readonly loading = signal(false);
  readonly sent = signal(false);

  submit(): void {
    this.loading.set(true);
    this.auth.forgotPassword(this.email().trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
    });
  }
}
