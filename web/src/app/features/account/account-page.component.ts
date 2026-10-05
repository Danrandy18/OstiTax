import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import type { Lang } from '../../core/i18n/translations';
import { RECEIPTS_TEXT } from '../../core/receipts/receipts-i18n';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

const MIN_PASSWORD_LENGTH = 8;

/** Intl directo: Angular solo tiene registrado el locale en-US. */
const DATE_LOCALES: Record<Lang, string> = {
  de: 'de-AT',
  en: 'en-GB',
  es: 'es-ES',
  tr: 'tr-TR',
  bcs: 'hr-HR',
  uk: 'uk-UA',
};

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DatePipe, FormsModule],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly receiptsLink = computed(() => RECEIPTS_TEXT[this.i18n.currentLang()].navLink);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);

  // Cambiar contrasena
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showPasswords = signal(false);
  readonly changingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordChanged = signal(false);
  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly canSubmitPassword = computed(
    () =>
      !this.changingPassword() &&
      this.currentPassword().length > 0 &&
      this.newPassword().length >= MIN_PASSWORD_LENGTH &&
      this.confirmPassword().length > 0,
  );

  // Suscripcion
  readonly confirmingCancel = signal(false);
  readonly subscriptionBusy = signal(false);
  readonly subscriptionError = signal<string | null>(null);

  /** Fecha hasta la que sigue Pro, en el idioma de la pagina. */
  readonly periodEnd = computed(() => {
    const end = this.auth.account()?.subscriptionCurrentPeriodEnd;
    if (!end) return '';
    return new Intl.DateTimeFormat(DATE_LOCALES[this.i18n.currentLang()], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(end));
  });

  /** Stripe mantiene Pro hasta el fin del periodo; PayPal lo termina al cancelar. */
  readonly cancelKeepsAccess = computed(
    () => this.auth.account()?.subscriptionProvider === 'stripe' && !!this.periodEnd(),
  );

  withDate(text: string): string {
    return text.replace('{date}', this.periodEnd());
  }

  changePassword(): void {
    const t = this.i18n.t();
    this.passwordError.set(null);
    this.passwordChanged.set(false);
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set(t.profilePasswordMismatch);
      return;
    }

    this.changingPassword.set(true);
    this.auth.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordChanged.set(true);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.showPasswords.set(false);
      },
      error: (err: { status?: number; error?: { code?: string } }) => {
        this.changingPassword.set(false);
        const code = err?.error?.code;
        this.passwordError.set(
          code === 'WRONG_PASSWORD'
            ? t.profilePasswordWrong
            : code === 'SAME_PASSWORD'
              ? t.profilePasswordSame
              : err?.status === 429
                ? t.profilePasswordTooMany
                : t.authErrorGeneric,
        );
      },
    });
  }

  setCanceled(cancel: boolean): void {
    this.subscriptionBusy.set(true);
    this.subscriptionError.set(null);
    this.auth.setSubscriptionCanceled(cancel).subscribe({
      next: () => {
        this.subscriptionBusy.set(false);
        this.confirmingCancel.set(false);
      },
      error: () => {
        this.subscriptionBusy.set(false);
        this.subscriptionError.set(this.i18n.t().profileSubscriptionError);
      },
    });
  }

  askDelete(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  confirmDelete(): void {
    this.deleting.set(true);
    this.error.set(null);
    this.auth.deleteAccount().subscribe({
      next: () => {
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.deleting.set(false);
        this.error.set(this.i18n.t().authErrorGeneric);
      },
    });
  }
}
