import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
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
import type { AccountStatus, AuthResponse } from '../models/api.models';

const TOKEN_STORAGE_KEY = 'authToken';
const PRO_POLL_INTERVAL_MS = 2500;
const PRO_POLL_MAX_ATTEMPTS = 24;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private bootstrapPromise: Promise<void> | null = null;

  private proPolling: Subscription | null = null;

  readonly account = signal<AccountStatus | null>(null);
  readonly token = signal<string | null>(null);
  readonly ready = signal(false);
  readonly activatingPro = signal(false);

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
      .post<AuthResponse>('/api/auth/register', { email, password, name })
      .pipe(tap((response) => this.persist(response)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.persist(response)));
  }

  loginWithGoogle(idToken: string) {
    return this.http
      .post<AuthResponse>('/api/auth/google', { idToken })
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
    return this.http.post<{ ok: true }>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ ok: true }>('/api/auth/reset-password', {
      token,
      password,
    });
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
