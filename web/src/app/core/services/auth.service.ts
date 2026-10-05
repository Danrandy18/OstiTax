import { Injectable, effect, inject, signal, untracked, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  exhaustMap,
  firstValueFrom,
  of,
  take,
  takeWhile,
  tap,
  timer,
  type Subscription,
} from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import type { AccountStatus, AuthResponse } from '../models/api.models';

const TOKEN_STORAGE_KEY = 'authToken';
const PRO_POLL_INTERVAL_MS = 2500;
const PRO_POLL_MAX_ATTEMPTS = 24;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);
  private bootstrapPromise: Promise<void> | null = null;

  private proPolling: Subscription | null = null;

  readonly account = signal<AccountStatus | null>(null);
  readonly token = signal<string | null>(null);
  readonly ready = signal(false);
  readonly activatingPro = signal(false);
  /** El backend solo lo activa si puede enviar el correo (Resend configurado). */
  readonly passwordResetAvailable = signal(false);

  constructor() {
    // Los correos (contrasena, Pro, facturas) salen en el idioma de la pagina: al cambiarlo con
    // la sesion iniciada se avisa al backend. No consume intentos gratis.
    effect(() => {
      const lang = this.i18n.currentLang();
      const account = this.account();
      if (!account || account.locale === lang) return;
      untracked(() => {
        this.http
          .patch<AccountStatus>('/api/auth/me', { locale: lang })
          .pipe(catchError(() => of(null)))
          .subscribe((updated) => {
            if (updated && this.account()?.id === updated.id) this.account.set(updated);
          });
      });
    });
  }

  private get locale(): string {
    return this.i18n.currentLang();
  }

  ensureAuth(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }
    return this.bootstrapPromise;
  }

  private async bootstrap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      // El estado de sesion depende de localStorage: en el servidor no hay sesion que restaurar.
      this.ready.set(true);
      return;
    }

    this.http
      .get<{ passwordReset: boolean }>('/api/auth/config')
      .pipe(catchError(() => of({ passwordReset: false })))
      .subscribe((config) => this.passwordResetAvailable.set(config.passwordReset));

    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      this.ready.set(true);
      return;
    }

    this.token.set(stored);
    try {
      const account = await firstValueFrom(
        this.http.get<AccountStatus>('/api/auth/me'),
      );
      this.account.set(account);
    } catch {
      this.clearSession();
    } finally {
      this.ready.set(true);
    }
  }

  register(email: string, password: string, name?: string) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { email, password, name, locale: this.locale })
      .pipe(tap((response) => this.persist(response)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password, locale: this.locale })
      .pipe(tap((response) => this.persist(response)));
  }

  loginWithGoogle(idToken: string) {
    return this.http
      .post<AuthResponse>('/api/auth/google', { idToken, locale: this.locale })
      .pipe(tap((response) => this.persist(response)));
  }

  deleteAccount() {
    return this.http
      .delete<void>('/api/auth/me')
      .pipe(tap(() => this.clearSession()));
  }

  /** Refresca el estado de la cuenta (ej. tras volver de un checkout de pago). */
  refreshAccount() {
    return this.http
      .get<AccountStatus>('/api/auth/me')
      .pipe(tap((account) => this.account.set(account)));
  }

  /**
   * Stripe y PayPal redirigen antes de que su webhook llegue al backend: pro se activa unos
   * segundos despues. Vive aqui y no en la pagina de exito para que siga aunque el usuario
   * navegue a otra pantalla; toda la UI lee account(), asi que se actualiza sola.
   */
  pollUntilPro(): void {
    if (!isPlatformBrowser(this.platformId) || !this.token()) {
      return;
    }

    this.proPolling?.unsubscribe();
    this.activatingPro.set(true);
    this.proPolling = timer(0, PRO_POLL_INTERVAL_MS)
      .pipe(
        take(PRO_POLL_MAX_ATTEMPTS),
        exhaustMap(() => this.refreshAccount().pipe(catchError(() => of(null)))),
        takeWhile((account) => !account?.isPro, true),
      )
      .subscribe({ complete: () => this.activatingPro.set(false) });
  }

  logout(): void {
    this.clearSession();
  }

  forgotPassword(email: string) {
    // mode 'code': sin SMTP, se pide el codigo de prueba en vez de esperar un correo.
    return this.http.post<{ ok: true; mode?: 'email' | 'code' }>('/api/auth/forgot-password', {
      email,
      locale: this.locale,
    });
  }

  resetPasswordWithCode(email: string, code: string, password: string) {
    return this.http.post<{ ok: true }>('/api/auth/reset-password/code', {
      email,
      code,
      password,
    });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ ok: true }>('/api/auth/reset-password', {
      token,
      password,
    });
  }

  /**
   * Cambia la contrasena con la sesion iniciada. El backend cierra las demas sesiones y
   * devuelve un token nuevo para esta.
   */
  changePassword(currentPassword: string, newPassword: string) {
    return this.http
      .post<AuthResponse>('/api/auth/change-password', { currentPassword, newPassword })
      .pipe(tap((response) => this.persist(response)));
  }

  /** Cancelar o reactivar la suscripcion: el backend devuelve el estado actualizado. */
  setSubscriptionCanceled(cancel: boolean) {
    return this.http
      .post<AccountStatus>(cancel ? '/api/billing/cancel' : '/api/billing/resume', {})
      .pipe(tap((account) => this.account.set(account)));
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.token.set(response.accessToken);
    this.account.set(response.account);
  }

  private clearSession(): void {
    this.proPolling?.unsubscribe();
    this.activatingPro.set(false);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.token.set(null);
    this.account.set(null);
  }
}
