import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BRAND } from '../core/brand';
import { AuthService } from '../core/services/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { SessionService } from '../core/services/session.service';
import type { Lang } from '../core/i18n/translations';
import { TranslatePipe } from '../shared/pipes/app.pipes';
import { LoginModalComponent } from '../features/auth/login-modal.component';

/** Unicas rutas publicas e indexables: la calculadora y sus versiones por idioma. */
const INDEXABLE_PATHS = new Set(['/', '/en', '/es', '/tr', '/uk', '/bcs']);

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, FormsModule, LoginModalComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  /** Marca fija en alemán: no depende del idioma de la UI. */
  readonly brand = BRAND;
  readonly i18n = inject(I18nService);
  readonly session = inject(SessionService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginModalOpen = signal(false);

  constructor() {
    // Rutas /en, /es, etc. fuerzan ese idioma (para SEO por idioma); ver app.routes.ts.
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.applyRouteLang();
      this.applyIndexing();
    });
  }

  ngOnInit(): void {
    this.applyRouteLang();
    this.applyIndexing();
    void this.session.ensureSession();
    void this.auth.ensureAuth();
  }

  onLanguageChange(value: Lang): void {
    this.i18n.setLanguage(value);
  }

  openLogin(): void {
    this.loginModalOpen.set(true);
  }

  closeLogin(): void {
    this.loginModalOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  private applyIndexing(): void {
    const path = this.router.url.split(/[?#]/)[0];
    this.i18n.setIndexable(INDEXABLE_PATHS.has(path));
  }

  private applyRouteLang(): void {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    const lang = child?.snapshot.data['lang'] as Lang | undefined;
    if (lang) {
      this.i18n.setLanguage(lang);
    }
  }
}
