import { MAIL_LOCALES, MAIL_TEXT, toMailLocale } from './mail-i18n';
import {
  escapeHtml,
  renderPasswordChanged,
  renderPasswordReset,
  renderPaymentReceipt,
  renderProWelcome,
  renderSubscriptionCanceled,
} from './mail-templates';

const appUrl = 'https://xn--stitax-vxa.at';
const recipient = (locale: string | null, name: string | null = 'Ana') => ({
  locale,
  name,
  email: 'ana@example.com',
});

function keys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => keys(v, `${prefix}[${i}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) =>
      keys(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

describe('textos de los correos', () => {
  it('los 6 idiomas tienen exactamente las mismas claves', () => {
    const de = keys(MAIL_TEXT.de).sort();
    for (const locale of MAIL_LOCALES) {
      expect(keys(MAIL_TEXT[locale]).sort()).toEqual(de);
    }
  });

  it('un idioma desconocido o vacio cae a aleman, nunca a ingles', () => {
    expect(toMailLocale(undefined)).toBe('de');
    expect(toMailLocale(null)).toBe('de');
    expect(toMailLocale('fr')).toBe('de');
    expect(toMailLocale('EN')).toBe('de');
    expect(toMailLocale('uk')).toBe('uk');
  });
});

describe('plantillas', () => {
  it('bienvenida Pro: en el idioma del usuario, con todas las funciones y la renovacion', () => {
    const mail = renderProWelcome({
      recipient: recipient('es'),
      appUrl,
      renewsOn: new Date('2026-11-05T10:00:00Z'),
    });
    expect(mail.subject).toBe('Bienvenido/a a ÖstiTax Pro');
    expect(mail.html).toContain('Hola, Ana:');
    for (const feature of MAIL_TEXT.es.proWelcome.features) {
      expect(mail.html).toContain(escapeHtml(feature.title));
      expect(mail.text).toContain(feature.title);
    }
    expect(mail.text).toContain('5 de noviembre de 2026');
    expect(mail.html).toContain(`href="${appUrl}"`);
    // El dominio IDN se muestra legible.
    expect(mail.html).toContain('östitax.at');
    expect(mail.html).toContain('<html lang="es">');
  });

  it('cada plantilla se genera en los 6 idiomas sin placeholders sin rellenar', () => {
    for (const locale of MAIL_LOCALES) {
      const mails = [
        renderProWelcome({
          recipient: recipient(locale),
          appUrl,
          renewsOn: null,
        }),
        renderPasswordReset({
          recipient: recipient(locale),
          appUrl,
          resetUrl: `${appUrl}/reset-password?token=abc`,
          expiresInMinutes: 60,
        }),
        renderPasswordChanged({
          recipient: recipient(locale),
          appUrl,
          changedAt: new Date('2026-10-05T08:30:00Z'),
        }),
        renderSubscriptionCanceled({
          recipient: recipient(locale),
          appUrl,
          accessUntil: new Date(Date.now() + 10 * 86_400_000),
        }),
        renderPaymentReceipt({
          recipient: recipient(locale),
          appUrl,
          payment: {
            amount: 3.99,
            currency: 'eur',
            interval: 'monthly',
            periodStart: new Date('2026-10-05T00:00:00Z'),
            periodEnd: new Date('2026-11-05T00:00:00Z'),
            invoiceNumber: 'ABC-0001',
            paidAt: new Date('2026-10-05T00:00:00Z'),
            provider: 'Stripe',
            invoiceUrl: 'https://invoice.stripe.com/i/x',
            invoicePdfUrl: 'https://pay.stripe.com/invoice/x/pdf',
          },
        }),
      ];
      for (const mail of mails) {
        expect(mail.subject.length).toBeGreaterThan(3);
        expect(mail.html).not.toMatch(/\{(name|email|date|minutes|provider)\}/);
        expect(mail.text).not.toMatch(/\{(name|email|date|minutes|provider)\}/);
        expect(mail.html).toContain('Ulmgasse 14C');
      }
    }
  });

  it('recuperar contraseña: enlace, validez y aviso de ignorar', () => {
    const resetUrl = `${appUrl}/reset-password?token=abc123`;
    const mail = renderPasswordReset({
      recipient: recipient('de', null),
      appUrl,
      resetUrl,
      expiresInMinutes: 60,
    });
    expect(mail.subject).toBe('Passwort zurücksetzen');
    expect(mail.html).toContain(`href="${resetUrl}"`);
    expect(mail.text).toContain('Hallo,');
    expect(mail.text).toContain('60 Minuten');
    expect(mail.text).toContain(resetUrl);
  });

  it('contraseña cambiada: fecha en hora de Viena y enlace para recuperarla', () => {
    const mail = renderPasswordChanged({
      recipient: recipient('de'),
      appUrl,
      changedAt: new Date('2026-10-05T08:30:00Z'),
    });
    expect(mail.text).toContain('10:30');
    expect(mail.html).toContain(`${appUrl}/forgot-password`);
  });

  it('cancelacion: con fecha si Pro sigue, o "terminado" si ya acabo', () => {
    const future = new Date(Date.now() + 5 * 86_400_000);
    expect(
      renderSubscriptionCanceled({
        recipient: recipient('en'),
        appUrl,
        accessUntil: future,
      }).text,
    ).toContain('stay active until');
    expect(
      renderSubscriptionCanceled({
        recipient: recipient('en'),
        appUrl,
        accessUntil: null,
      }).text,
    ).toContain('ended today');
  });

  it('recibo: importe, plan, numero y enlaces a la factura', () => {
    const mail = renderPaymentReceipt({
      recipient: recipient('de'),
      appUrl,
      payment: {
        amount: 39.9,
        currency: 'eur',
        interval: 'yearly',
        periodStart: new Date('2026-10-05T00:00:00Z'),
        periodEnd: new Date('2027-10-05T00:00:00Z'),
        invoiceNumber: 'OST-0042',
        paidAt: new Date('2026-10-05T00:00:00Z'),
        provider: 'Stripe',
        invoiceUrl: 'https://invoice.stripe.com/i/x',
        invoicePdfUrl: 'https://pay.stripe.com/invoice/x/pdf',
      },
    });
    expect(mail.subject).toBe('Zahlungsbestätigung ÖstiTax Pro · OST-0042');
    expect(mail.text).toContain('39,90');
    expect(mail.text).toContain('Pro · jährlich');
    expect(mail.html).toContain('https://invoice.stripe.com/i/x');
    expect(mail.html).toContain('https://pay.stripe.com/invoice/x/pdf');
  });

  it('bienvenida Pro: invita a la app de Google Play solo cuando hay enlace', () => {
    const play = 'https://play.google.com/store/apps/details?id=at.ostitax.app';
    const without = renderProWelcome({
      recipient: recipient('es'),
      appUrl,
      renewsOn: null,
    });
    expect(without.html).not.toContain('play.google.com');
    expect(without.text).not.toContain(MAIL_TEXT.es.proWelcome.iosSoon);

    for (const locale of MAIL_LOCALES) {
      const mail = renderProWelcome({
        recipient: recipient(locale),
        appUrl,
        renewsOn: null,
        playStoreUrl: play,
      });
      const w = MAIL_TEXT[locale].proWelcome;
      expect(mail.html).toContain(`href="${play}"`);
      expect(mail.html).toContain(escapeHtml(w.playCta));
      expect(mail.html).toContain(escapeHtml(w.iosSoon));
      expect(mail.text).toContain(`${w.playCta}: ${play}`);
    }
  });

  it('escapa el nombre del usuario (sin HTML inyectado)', () => {
    const mail = renderProWelcome({
      recipient: recipient('en', '<script>alert(1)</script>'),
      appUrl,
      renewsOn: null,
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });
});
