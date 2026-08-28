import { Injectable, computed, effect, signal } from '@angular/core';
import { BRAND } from '../brand';
import { LANG_OPTIONS, TRANSLATIONS, type Lang, type TranslationSchema } from './translations';

const STORAGE_KEY = 'app_lang';

const DOCUMENT_TITLES: Record<Lang, string> = {
  de: BRAND.seoTitleDe,
  en: 'NettoKlar — Net salary calculator Austria 2026 | Gross to net',
  es: 'NettoKlar — Calcula tu salario neto Austria 2026 | Bruto a neto',
  tr: 'NettoKlar — Avusturya net maaş hesaplayıcı 2026',
  bcs: 'NettoKlar — Neto plata Austrija 2026 | Bruto u neto',
  uk: 'NettoKlar — Нетто зарплата Австрія 2026 | Брутто в нетто',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly currentLang = signal<Lang>(this.loadStoredLang());
  readonly t = computed<TranslationSchema>(() => TRANSLATIONS[this.currentLang()]);
  readonly langOptions = LANG_OPTIONS;

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      document.title = DOCUMENT_TITLES[lang];
      document.documentElement.lang = lang === 'bcs' ? 'hr' : lang === 'de' ? 'de-AT' : lang;
    });
  }

  setLanguage(lang: Lang): void {
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  private loadStoredLang(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in TRANSLATIONS) {
      return stored;
    }
    return 'de';
  }
}
