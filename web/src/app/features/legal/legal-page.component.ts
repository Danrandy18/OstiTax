import { Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LEGAL, legalAddress } from '../../core/legal/legal-data';
import { LEGAL_CONTENT, type LegalDocId } from '../../core/legal/legal-content';
import { BRAND } from '../../core/brand';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

const LEGAL_PATHS: Record<LegalDocId, string> = {
  privacy: 'privacy',
  impressum: 'impressum',
  deleteAccount: 'delete-account',
};

const DATE_LOCALES = {
  de: 'de-AT',
  en: 'en-GB',
  es: 'es-ES',
  tr: 'tr-TR',
  bcs: 'hr-HR',
  uk: 'uk-UA',
} as const;

/** Sustituye los placeholders de los textos legales por los datos reales del titular. */
export function fillLegal(text: string): string {
  return text
    .replaceAll('{owner}', LEGAL.owner)
    .replaceAll('{trade}', LEGAL.tradeName)
    .replaceAll('{address}', legalAddress())
    .replaceAll('{email}', LEGAL.email)
    .replaceAll('{domain}', BRAND.domain);
}

/** Impressum, politica de privacidad y borrado de cuenta: una sola pagina, tres documentos. */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <article class="legal card">
      <h1>{{ doc().title }}</h1>
      <p class="legal-updated">{{ doc().updatedLabel }}: {{ updatedAt() }}</p>

      @for (section of doc().sections; track section.heading) {
        <section>
          <h2>{{ section.heading }}</h2>
          @for (paragraph of section.body; track $index) {
            <p>{{ fill(paragraph) }}</p>
          }
        </section>
      }

      @if (isImpressum) {
        @if (extra.length) {
          <section>
            @for (line of extra; track line) {
              <p>{{ line }}</p>
            }
          </section>
        }
      }

      <a routerLink="/" class="back-link">{{ 'backToCalculator' | translate }}</a>
    </article>
  `,
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  readonly docId = this.route.snapshot.data['doc'] as LegalDocId;
  readonly doc = computed(() => LEGAL_CONTENT[this.i18n.currentLang()][this.docId]);

  constructor() {
    // Titulo y canonical propios de esta pagina (no los de la portada); se restauran al salir.
    effect(() => this.i18n.pageTitle.set(this.doc().title));
    this.i18n.pageCanonicalPath.set(LEGAL_PATHS[this.docId]);
    inject(DestroyRef).onDestroy(() => {
      this.i18n.pageTitle.set(null);
      this.i18n.pageCanonicalPath.set(null);
    });
  }
  readonly isImpressum = this.docId === 'impressum';
  readonly fill = fillLegal;

  /** Fecha en el formato del idioma actual (AAAA-MM-DD -> "20. September 2026"). */
  readonly updatedAt = computed(() =>
    new Date(`${LEGAL.updatedAt}T12:00:00Z`).toLocaleDateString(
      DATE_LOCALES[this.i18n.currentLang()],
      { year: 'numeric', month: 'long', day: 'numeric' },
    ),
  );

  /** Datos opcionales del Impressum: solo se muestran si estan rellenados en LEGAL. */
  readonly extra: string[] = [
    LEGAL.vatId ? `UID: ${LEGAL.vatId}` : '',
    LEGAL.tradeAuthority,
    LEGAL.chamber,
  ].filter(Boolean);
}
