import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { BRAND } from '../brand';
import { LANG_OPTIONS, TRANSLATIONS, type Lang, type TranslationSchema } from './translations';

const STORAGE_KEY = 'app_lang';
const SITE_URL = 'https://ostitax.at';

const DOCUMENT_TITLES: Record<Lang, string> = {
  de: BRAND.seoTitleDe,
  en: 'ÖstiTax — Net salary calculator Austria 2026 | Gross to net',
  es: 'ÖstiTax — Calcula tu salario neto Austria 2026 | Bruto a neto',
  tr: 'ÖstiTax — Avusturya net maaş hesaplayıcı 2026',
  bcs: 'ÖstiTax — Neto plata Austrija 2026 | Bruto u neto',
  uk: 'ÖstiTax — Нетто зарплата Австрія 2026 | Брутто в нетто',
};

/** Ruta de cada version de idioma; '' corresponde a la raiz (de-AT, idioma por defecto). */
const LANG_PATHS: Record<Lang, string> = {
  de: '',
  en: 'en',
  es: 'es',
  tr: 'tr',
  bcs: 'bcs',
  uk: 'uk',
};

const HTML_LANGS: Record<Lang, string> = {
  de: 'de-AT',
  en: 'en',
  es: 'es',
  tr: 'tr',
  bcs: 'hr',
  uk: 'uk',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly meta = inject(Meta);

  readonly currentLang = signal<Lang>(this.loadStoredLang());
  readonly t = computed<TranslationSchema>(() => TRANSLATIONS[this.currentLang()]);
  readonly langOptions = LANG_OPTIONS;

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      const translation = TRANSLATIONS[lang];
      const title = DOCUMENT_TITLES[lang];
      const canonicalUrl = `${SITE_URL}/${LANG_PATHS[lang]}`;

      this.document.title = title;
      this.document.documentElement.lang = HTML_LANGS[lang];

      this.meta.updateTag({ name: 'description', content: translation.seoLead });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: translation.seoLead });
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });

      this.document
        .querySelector('link[rel="canonical"]')
        ?.setAttribute('href', canonicalUrl);
    });
  }

  setLanguage(lang: Lang): void {
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  private loadStoredLang(): Lang {
    if (!isPlatformBrowser(this.platformId)) {
      return 'de';
    }
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in TRANSLATIONS) {
      return stored;
    }
    return 'de';
  }
}
