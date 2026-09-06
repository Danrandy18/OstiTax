import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { GOOGLE_CLIENT_ID } from '../../core/auth-config';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

type AuthMode = 'login' | 'register';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme: string; size: string; width?: number },
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './auth-panel.component.html',
  styleUrl: './auth-panel.component.scss',
})
export class AuthPanelComponent {
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  private readonly googleButtonEl = viewChild<ElementRef<HTMLDivElement>>('googleButton');

  readonly mode = signal<AuthMode>('login');
  readonly email = signal('');
  readonly password = signal('');
  readonly name = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.initGoogleButton();
  }

  switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  submit(): void {
    this.error.set(null);
    this.loading.set(true);
    const email = this.email().trim();
    const password = this.password();

    const request =
      this.mode() === 'login'
        ? this.auth.login(email, password)
        : this.auth.register(email, password, this.name().trim() || undefined);

    request.subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.mapError(err));
      },
    });
  }

  private mapError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 409) {
      return this.i18n.t().authErrorEmailTaken;
    }
    if (status === 401) {
      return this.i18n.t().authErrorInvalidCredentials;
    }
    return this.i18n.t().authErrorGeneric;
  }

  private initGoogleButton(): void {
    if (!GOOGLE_CLIENT_ID || !window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => this.onGoogleCredential(response.credential),
    });

    queueMicrotask(() => {
      const el = this.googleButtonEl()?.nativeElement;
      if (el && window.google) {
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      }
    });
  }

  private onGoogleCredential(idToken: string): void {
    this.error.set(null);
    this.loading.set(true);
    this.auth.loginWithGoogle(idToken).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t().authErrorGoogleFailed);
      },
    });
  }
}
