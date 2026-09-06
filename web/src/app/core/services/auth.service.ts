import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import type { AccountStatus, AuthResponse } from '../models/api.models';

const TOKEN_STORAGE_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private bootstrapPromise: Promise<void> | null = null;

  readonly account = signal<AccountStatus | null>(null);
  readonly token = signal<string | null>(null);
  readonly ready = signal(false);

  ensureAuth(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }
    return this.bootstrapPromise;
  }

  private async bootstrap(): Promise<void> {
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

  logout(): void {
    this.clearSession();
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.token.set(response.accessToken);
    this.account.set(response.account);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.token.set(null);
    this.account.set(null);
  }
}
