import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import type { UserStatus } from '../models/api.models';

const DEVICE_STORAGE_KEY = 'deviceId';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private bootstrapPromise: Promise<void> | null = null;

  readonly deviceId = signal<string | null>(null);
  readonly status = signal<UserStatus | null>(null);
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);

  ensureSession(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }
    return this.bootstrapPromise;
  }

  private async bootstrap(): Promise<void> {
    try {
      const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
      const body = stored ? { deviceId: stored } : {};
      const status = await firstValueFrom(
        this.http.post<UserStatus>('/api/users/session', body),
      );
      localStorage.setItem(DEVICE_STORAGE_KEY, status.deviceId);
      this.deviceId.set(status.deviceId);
      this.status.set(status);
      this.error.set(null);
    } catch {
      this.error.set('session');
      this.bootstrapPromise = null;
    } finally {
      this.ready.set(true);
    }
  }

  refreshStatus() {
    return this.http.get<UserStatus>('/api/billing/status').pipe(
      tap((status) => {
        this.status.set(status);
        this.deviceId.set(status.deviceId);
      }),
    );
  }

  /** Solo QA: el backend rechaza esto fuera de development. */
  resetAttemptsForTesting() {
    return this.http.post<UserStatus>('/api/users/dev/reset-attempts', {}).pipe(
      tap((status) => {
        this.status.set(status);
        this.deviceId.set(status.deviceId);
      }),
    );
  }
}
