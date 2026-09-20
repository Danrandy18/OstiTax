import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { BRAND } from '../brand';
import { LANG_OPTIONS, TRANSLATIONS, type Lang, type TranslationSchema } from './translations';

const STORAGE_KEY = 'app_lang';
const SITE_URL = BRAND.siteUrl;
const LD_JSON_ID = 'ld-json';
/** Escape JSON de '<' (barra invertida + u003c); evita que un texto cierre la etiqueta <script>. */
const LESS_THAN_ESCAPED = '\\' + 'u003c';
const ROBOTS_INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1';

const DOCUMENT_TITLES: Record<Lang, string> = {
  de: BRAND.seoTitleDe,
  en: 'ÖstiTax — Net salary calculator Austria 2026 | Gross to net',
  es: 'ÖstiTax — Calcula tu salario neto Austria 2026 | Bruto a neto',
  tr: 'ÖstiTax — Avusturya net maaş hesaplayıcı 2026',
  bcs: 'ÖstiTax — Neto plata Austrija 2026 | Bruto u neto',
  uk: 'ÖstiTax — Нетто зарплата Австрія 2026 | Брутто в нетто',
};

/** Descripciones de 130-160 caracteres para el snippet de busqueda (seoLead es demasiado corto). */
const DOCUMENT_DESCRIPTIONS: Record<Lang, string> = {
  de: 'Nettogehalt Österreich in Sekunden berechnen: Lohnsteuer, Sozialversicherung, 13./14. Gehalt, Familienbonus Plus und Pendlerpauschale. Stand 2026.',
  en: 'Calculate your net salary in Austria in seconds: income tax, social insurance, 13th/14th salary, Familienbonus Plus and commuter allowance. 2026 tables.',
  es: 'Calcula tu salario neto en Austria en segundos: impuesto sobre la renta, seguridad social, pagas 13.ª y 14.ª, Familienbonus Plus y Pendlerpauschale. Tablas 2026.',
  tr: "Avusturya'da net maaşınızı saniyeler içinde hesaplayın: gelir vergisi, sosyal sigorta, 13. ve 14. maaş, Familienbonus Plus ve yol indirimi. 2026 tabloları.",
  bcs: 'Izračunajte neto platu u Austriji za nekoliko sekundi: porez na dohodak, socijalno osiguranje, 13. i 14. plata, Familienbonus Plus i putni odbitak. Tablice 2026.',
  uk: 'Розрахуйте нетто-зарплату в Австрії за секунди: податок на дохід, соціальне страхування, 13-та й 14-та зарплата, Familienbonus Plus. Таблиці 2026.',
};

const OG_LOCALES: Record<Lang, string> = {
  de: 'de_AT',
  en: 'en_US',
  es: 'es_ES',
  tr: 'tr_TR',
  bcs: 'hr_HR',
  uk: 'uk_UA',
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
      const description = DOCUMENT_DESCRIPTIONS[lang];
      const canonicalUrl = `${SITE_URL}/${LANG_PATHS[lang]}`;

      this.document.title = title;
      this.document.documentElement.lang = HTML_LANGS[lang];

      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
      this.meta.updateTag({ name: 'twitter:title', content: title });
      this.meta.updateTag({ name: 'twitter:description', content: description });
      this.updateOgLocales(lang);

      this.document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);

      this.updateJsonLd(lang, translation, description, canonicalUrl);
    });
  }

  /** Las pantallas privadas o transaccionales no deben indexarse; las de idioma si. */
  setIndexable(indexable: boolean): void {
    const content = indexable ? ROBOTS_INDEXABLE : 'noindex, nofollow';
    this.meta.updateTag({ name: 'robots', content });
    this.meta.updateTag({
      name: 'googlebot',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    });
  }

  private updateOgLocales(lang: Lang): void {
    this.meta.updateTag({ property: 'og:locale', content: OG_LOCALES[lang] });
    this.document
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((node) => node.remove());
    for (const other of Object.keys(OG_LOCALES) as Lang[]) {
      if (other !== lang) {
        this.meta.addTag({ property: 'og:locale:alternate', content: OG_LOCALES[other] });
      }
    }
  }

  /**
   * Datos estructurados por idioma: el FAQ debe coincidir con el texto visible de la pagina,
   * asi que se genera desde las mismas traducciones (antes era un JSON-LD fijo en aleman).
   */
  private updateJsonLd(
    lang: Lang,
    translation: TranslationSchema,
    description: string,
    canonicalUrl: string,
  ): void {
    const organizationId = `${SITE_URL}/#organization`;
    const data = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: BRAND.name,
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/icon-512.png`,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: BRAND.name,
          publisher: { '@id': organizationId },
          inLanguage: Object.values(HTML_LANGS),
        },
        {
          '@type': 'WebApplication',
          '@id': `${canonicalUrl}#app`,
          name: BRAND.name,
          url: canonicalUrl,
          description,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          inLanguage: HTML_LANGS[lang],
          areaServed: { '@type': 'Country', name: 'Austria' },
          publisher: { '@id': organizationId },
          offers: [
            { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
            { '@type': 'Offer', name: 'Pro', price: '3.99', priceCurrency: 'EUR' },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': `${canonicalUrl}#faq`,
          inLanguage: HTML_LANGS[lang],
          mainEntity: [
            [translation.faqQ1, translation.faqA1],
            [translation.faqQ2, translation.faqA2],
            [translation.faqQ3, translation.faqA3],
          ].map(([question, answer]) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
        },
      ],
    };

    let script = this.document.getElementById(LD_JSON_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.id = LD_JSON_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data).replace(/</g, LESS_THAN_ESCAPED);
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
