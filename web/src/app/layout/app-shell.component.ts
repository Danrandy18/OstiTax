import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BRAND } from '../core/brand';
import { AuthService } from '../core/services/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { SessionService } from '../core/services/session.service';
import { UpgradeService } from '../core/services/upgrade.service';
import type { Lang } from '../core/i18n/translations';
import { TranslatePipe } from '../shared/pipes/app.pipes';
import { LoginModalComponent } from '../features/auth/login-modal.component';
import { PaymentModalComponent } from '../features/payment/payment-modal.component';
import { UpgradeCompareModalComponent } from '../features/upgrade/upgrade-compare-modal.component';

/** Unicas rutas publicas e indexables: la calculadora y sus versiones por idioma. */
const INDEXABLE_PATHS = new Set([
  '/',
  '/en',
  '/es',
  '/tr',
  '/uk',
  '/bcs',
  '/privacy',
  '/impressum',
  '/delete-account',
]);

/** Paginas legales: se muestran siempre, aunque el backend este dormido o falle la sesion. */
const LEGAL_PATHS = new Set(['/privacy', '/impressum', '/delete-account']);

/** Duracion del desvanecido antes de intercambiar los textos (coincide con --duration-fast). */
const LANG_FADE_OUT_MS = 150;
/** Cuanto tiempo se muestra el aviso con el nombre del idioma. */
const LANG_TOAST_MS = 1900;

@Component({
  selector: 'app-shell',
  standalone: true,
  host: {
    '[class.lang-out]': 'langPhase() === "out"',
    '[class.lang-in]': 'langPhase() === "in"',
  },
  imports: [
    RouterOutlet,
    RouterLink,
    TranslatePipe,
    FormsModule,
    LoginModalComponent,
    PaymentModalComponent,
    UpgradeCompareModalComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  /** Marca fija en alemán: no depende del idioma de la UI. */
  readonly brand = BRAND;
  readonly i18n = inject(I18nService);
  readonly session = inject(SessionService);
  readonly auth = inject(AuthService);
  readonly upgrade = inject(UpgradeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginModalOpen = signal(false);
  readonly isLegalRoute = signal(false);
  /** Fase de la animacion al cambiar de idioma: desvanecer ('out'), reaparecer ('in'). */
  readonly langPhase = signal<'idle' | 'out' | 'in'>('idle');
  /** Nombre (en su propio idioma) del idioma recien elegido; avisa del cambio. */
  readonly langToast = signal<string | null>(null);
  private langTimer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.langTimer);
      clearTimeout(this.toastTimer);
    });

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
    if (value === this.i18n.currentLang()) {
      return;
    }

    clearTimeout(this.langTimer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.i18n.setLanguage(value);
      this.showLangToast(value);
      return;
    }

    // Desvanece el contenido, cambia los textos con todo invisible y lo hace reaparecer:
    // asi el cambio se percibe como una transicion y no como un salto brusco.
    this.langPhase.set('out');
    this.langTimer = setTimeout(() => {
      this.i18n.setLanguage(value);
      this.langPhase.set('in');
      this.showLangToast(value);
    }, LANG_FADE_OUT_MS);
  }

  private showLangToast(lang: Lang): void {
    const label = this.i18n.langOptions.find((option) => option.code === lang)?.label ?? lang;
    this.langToast.set(label);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.langToast.set(null), LANG_TOAST_MS);
  }

  openLogin(): void {
    this.loginModalOpen.set(true);
  }

  /** Desde la comparativa: quien ya tiene cuenta Pro entra por aqui. */
  loginFromCompare(): void {
    this.upgrade.closeCompare();
    this.openLogin();
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
    this.isLegalRoute.set(LEGAL_PATHS.has(path));
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
