import { LEGAL_CONTENT, type LegalDocId } from './legal-content';
import { fillLegal } from '../../features/legal/legal-page.component';
import { LEGAL, legalAddress } from './legal-data';

const LANGS = Object.keys(LEGAL_CONTENT) as (keyof typeof LEGAL_CONTENT)[];
const DOCS: LegalDocId[] = ['privacy', 'impressum', 'deleteAccount'];

describe('textos legales', () => {
  it('estan los 6 idiomas', () => {
    expect(LANGS.sort()).toEqual(['bcs', 'de', 'en', 'es', 'tr', 'uk']);
  });

  for (const doc of DOCS) {
    it(`"${doc}" tiene las mismas secciones en todos los idiomas`, () => {
      const reference = LEGAL_CONTENT.de[doc].sections.map((s) => s.body.length);
      for (const lang of LANGS) {
        const sections = LEGAL_CONTENT[lang][doc].sections;
        expect(sections.map((s) => s.body.length), `idioma ${lang}`).toEqual(reference);
        expect(LEGAL_CONTENT[lang][doc].title.trim(), `titulo ${lang}`).not.toBe('');
      }
    });
  }

  it('no queda ningun placeholder sin sustituir', () => {
    for (const lang of LANGS) {
      for (const doc of DOCS) {
        for (const section of LEGAL_CONTENT[lang][doc].sections) {
          for (const paragraph of [section.heading, ...section.body]) {
            expect(fillLegal(paragraph), `${lang}/${doc}`).not.toMatch(/[{}]/);
          }
        }
      }
    }
  });

  it('la direccion y el correo del titular salen en la politica y el Impressum', () => {
    for (const lang of LANGS) {
      for (const doc of ['privacy', 'impressum'] as const) {
        const text = LEGAL_CONTENT[lang][doc].sections
          .flatMap((s) => s.body)
          .map(fillLegal)
          .join(' ');
        expect(text, `${lang}/${doc}`).toContain(legalAddress());
        expect(text, `${lang}/${doc}`).toContain(LEGAL.email);
      }
    }
  });
});
