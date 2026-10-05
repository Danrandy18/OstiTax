import {
  INTL_LOCALE,
  MAIL_TEXT,
  toMailLocale,
  type MailLocale,
  type MailText,
} from './mail-i18n';

/**
 * Plantillas HTML de los correos. Maquetadas con tablas y estilos en linea para que se vean
 * igual en Gmail, Outlook y Apple Mail; cada correo lleva tambien su version en texto plano.
 * Logica pura (sin Nest) para poder probarla aislada.
 */

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

interface Recipient {
  locale: string | null | undefined;
  name: string | null | undefined;
  email: string;
}

const BRAND = {
  primary: '#0D5C56',
  primaryDark: '#0A4844',
  surface: '#F7F5F1',
  card: '#FFFFFF',
  text: '#211D17',
  muted: '#726B5E',
  border: '#E6E1D7',
  successTint: '#E7F2EA',
  warningTint: '#FBEEE2',
};

/** Datos del titular (ECG/UGB): los mismos que el Impressum de la web. */
const SENDER_LINE =
  'ÖstiTax · korevanSoftware, Randy Méndez Cabrera · Ulmgasse 14C, 8053 Graz, Österreich';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

export function formatDate(date: Date, locale: MailLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Vienna',
  }).format(date);
}

export function formatDateTime(date: Date, locale: MailLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna',
    timeZoneName: 'short',
  }).format(date);
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: MailLocale,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/** El dominio es un IDN: en los enlaces va en punycode, pero al usuario se le muestra legible. */
function displayHost(appUrl: string): string {
  try {
    const host = new URL(appUrl).host;
    return host === 'xn--stitax-vxa.at' ? 'östitax.at' : host;
  } catch {
    return appUrl;
  }
}

interface LayoutParts {
  t: MailText;
  recipient: Recipient;
  appUrl: string;
  preheader: string;
  badge?: string;
  title: string;
  /** HTML ya escapado. */
  body: string;
  cta?: { label: string; url: string };
  /** Muestra el enlace en texto bajo el boton (solo donde el enlace es imprescindible). */
  showLinkFallback?: boolean;
  /** HTML ya escapado, debajo del boton. */
  after?: string;
}

function greeting(t: MailText, recipient: Recipient): string {
  const name = recipient.name?.trim();
  return name ? fill(t.greetingNamed, { name }) : t.greeting;
}

function paragraph(html: string, color = BRAND.text): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${color};">${html}</p>`;
}

function button(label: string, url: string): string {
  const href = escapeHtml(url);
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" bgcolor="${BRAND.primary}" style="border-radius:10px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:20px;color:#FFFFFF;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

function layout(parts: LayoutParts): string {
  const { t, recipient, appUrl } = parts;
  const host = displayHost(appUrl);
  const footerReason = fill(escapeHtml(t.footerReason), {
    email: escapeHtml(recipient.email),
  });
  const badge = parts.badge
    ? `<div style="display:inline-block;margin:0 0 14px;padding:5px 12px;border-radius:999px;background:${BRAND.successTint};color:${BRAND.primary};font-size:12px;font-weight:bold;letter-spacing:1px;">${escapeHtml(parts.badge)}</div>`
    : '';
  const cta = parts.cta ? button(parts.cta.label, parts.cta.url) : '';
  const fallback =
    parts.cta && parts.showLinkFallback
      ? `<p style="margin:0 0 4px;font-size:12px;line-height:18px;color:${BRAND.muted};">${escapeHtml(t.linkFallback)}</p>
       <p style="margin:0 0 20px;font-size:12px;line-height:18px;word-break:break-all;"><a href="${escapeHtml(parts.cta.url)}" style="color:${BRAND.primary};">${escapeHtml(parts.cta.url)}</a></p>`
      : '';

  return `<!DOCTYPE html>
<html lang="${recipient.locale === 'bcs' ? 'hr' : escapeHtml(recipient.locale ?? 'de')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(parts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(parts.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.surface};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:0 4px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="36" height="36" align="center" bgcolor="${BRAND.primary}" style="border-radius:9px;color:#FFFFFF;font-size:14px;font-weight:bold;">ÖT</td>
                <td style="padding-left:10px;font-size:18px;font-weight:bold;color:${BRAND.text};">ÖstiTax</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:36px 32px 28px;">
            ${badge}
            <h1 style="margin:0 0 20px;font-size:24px;line-height:32px;color:${BRAND.text};font-weight:bold;">${escapeHtml(parts.title)}</h1>
            ${paragraph(escapeHtml(greeting(t, recipient)))}
            ${parts.body}
            ${cta}
            ${fallback}
            ${parts.after ?? ''}
            <p style="margin:8px 0 0;font-size:15px;line-height:24px;color:${BRAND.text};">${escapeHtml(t.signOff)}<br><strong>${escapeHtml(t.team)}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0;font-size:12px;line-height:18px;color:${BRAND.muted};text-align:center;">
            <p style="margin:0 0 8px;">${footerReason}</p>
            <p style="margin:0 0 8px;">
              <a href="${escapeHtml(appUrl)}" style="color:${BRAND.muted};">${escapeHtml(host)}</a> ·
              <a href="${escapeHtml(appUrl)}/privacy" style="color:${BRAND.muted};">${escapeHtml(t.footerPrivacy)}</a> ·
              <a href="${escapeHtml(appUrl)}/impressum" style="color:${BRAND.muted};">${escapeHtml(t.footerImprint)}</a>
            </p>
            <p style="margin:0;">${escapeHtml(SENDER_LINE)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function plainText(parts: {
  t: MailText;
  recipient: Recipient;
  appUrl: string;
  lines: string[];
  cta?: { label: string; url: string };
}): string {
  const { t, recipient, appUrl } = parts;
  return [
    greeting(t, recipient),
    '',
    ...parts.lines.flatMap((line) => [line, '']),
    ...(parts.cta ? [`${parts.cta.label}: ${parts.cta.url}`, ''] : []),
    t.signOff,
    t.team,
    '',
    '—',
    fill(t.footerReason, { email: recipient.email }),
    `${appUrl}/privacy · ${appUrl}/impressum`,
    SENDER_LINE,
  ].join('\n');
}

/* ------------------------------- Bienvenida Pro ------------------------------- */

export function renderProWelcome(params: {
  recipient: Recipient;
  appUrl: string;
  renewsOn: Date | null;
}): RenderedMail {
  const locale = toMailLocale(params.recipient.locale);
  const t = MAIL_TEXT[locale];
  const w = t.proWelcome;
  const intro = fill(w.intro, { email: params.recipient.email });
  const renewal = params.renewsOn
    ? fill(w.renewal, { date: formatDate(params.renewsOn, locale) })
    : null;

  const features = w.features
    .map(
      (f) => `
<tr>
  <td width="28" valign="top" style="padding:12px 0 0;">
    <div style="width:22px;height:22px;border-radius:11px;background:${BRAND.successTint};color:${BRAND.primary};font-size:13px;font-weight:bold;line-height:22px;text-align:center;">&#10003;</div>
  </td>
  <td valign="top" style="padding:12px 0 0 8px;">
    <div style="font-size:15px;line-height:22px;font-weight:bold;color:${BRAND.text};">${escapeHtml(f.title)}</div>
    <div style="font-size:14px;line-height:21px;color:${BRAND.muted};">${escapeHtml(f.body)}</div>
  </td>
</tr>`,
    )
    .join('');

  const body = `
${paragraph(escapeHtml(intro))}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;padding:8px 20px 20px;background:${BRAND.surface};border-radius:12px;">
  <tr><td colspan="2" style="padding:12px 0 0;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND.primary};">${escapeHtml(w.featuresTitle)}</td></tr>
  ${features}
</table>
${renewal ? paragraph(escapeHtml(renewal), BRAND.muted) : ''}
${paragraph(escapeHtml(w.manage), BRAND.muted)}`;

  const cta = { label: w.cta, url: params.appUrl };
  return {
    subject: w.subject,
    html: layout({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      preheader: w.preheader,
      badge: w.badge,
      title: w.title,
      body,
      cta,
    }),
    text: plainText({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      lines: [
        intro,
        `${w.featuresTitle}:`,
        ...w.features.map((f) => `• ${f.title}: ${f.body}`),
        ...(renewal ? [renewal] : []),
        w.manage,
      ],
      cta,
    }),
  };
}

/* ------------------------------ Restablecer clave ----------------------------- */

export function renderPasswordReset(params: {
  recipient: Recipient;
  appUrl: string;
  resetUrl: string;
  expiresInMinutes: number;
}): RenderedMail {
  const locale = toMailLocale(params.recipient.locale);
  const t = MAIL_TEXT[locale];
  const r = t.passwordReset;
  const intro = fill(r.intro, { email: params.recipient.email });
  const validity = fill(r.validity, {
    minutes: String(params.expiresInMinutes),
  });
  const cta = { label: r.cta, url: params.resetUrl };

  return {
    subject: r.subject,
    html: layout({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      preheader: r.preheader,
      title: r.title,
      body: paragraph(escapeHtml(intro)),
      cta,
      showLinkFallback: true,
      after:
        paragraph(escapeHtml(validity), BRAND.muted) +
        paragraph(escapeHtml(r.ignore), BRAND.muted),
    }),
    text: plainText({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      lines: [intro, validity, r.ignore],
      cta,
    }),
  };
}

/* ------------------------------ Clave cambiada ------------------------------- */

export function renderPasswordChanged(params: {
  recipient: Recipient;
  appUrl: string;
  changedAt: Date;
}): RenderedMail {
  const locale = toMailLocale(params.recipient.locale);
  const t = MAIL_TEXT[locale];
  const c = t.passwordChanged;
  const intro = fill(c.intro, {
    email: params.recipient.email,
    date: formatDateTime(params.changedAt, locale),
  });
  const cta = { label: c.cta, url: `${params.appUrl}/forgot-password` };
  const alert = `<div style="margin:0 0 20px;padding:14px 16px;border-radius:10px;background:${BRAND.warningTint};font-size:14px;line-height:21px;color:${BRAND.text};">${escapeHtml(c.notYou)}</div>`;

  return {
    subject: c.subject,
    html: layout({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      preheader: c.preheader,
      title: c.title,
      body:
        paragraph(escapeHtml(intro)) +
        paragraph(escapeHtml(c.sessions), BRAND.muted) +
        alert,
      cta,
    }),
    text: plainText({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      lines: [intro, c.sessions, c.notYou],
      cta,
    }),
  };
}

/* ---------------------------- Suscripcion cancelada --------------------------- */

export function renderSubscriptionCanceled(params: {
  recipient: Recipient;
  appUrl: string;
  /** Hasta cuando sigue Pro; null si termino ya. */
  accessUntil: Date | null;
}): RenderedMail {
  const locale = toMailLocale(params.recipient.locale);
  const t = MAIL_TEXT[locale];
  const c = t.subscriptionCanceled;
  const intro = fill(c.intro, { email: params.recipient.email });
  const access =
    params.accessUntil && params.accessUntil.getTime() > Date.now()
      ? fill(c.accessUntil, { date: formatDate(params.accessUntil, locale) })
      : c.accessEnded;
  const cta = { label: c.cta, url: `${params.appUrl}/account` };
  const highlight = `<div style="margin:0 0 20px;padding:14px 16px;border-radius:10px;background:${BRAND.surface};border:1px solid ${BRAND.border};font-size:15px;line-height:23px;color:${BRAND.text};"><strong>${escapeHtml(access)}</strong></div>`;

  return {
    subject: c.subject,
    html: layout({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      preheader: c.preheader,
      title: c.title,
      body:
        paragraph(escapeHtml(intro)) +
        highlight +
        paragraph(escapeHtml(c.keep), BRAND.muted) +
        paragraph(escapeHtml(c.changedMind), BRAND.muted),
      cta,
      after: paragraph(escapeHtml(c.feedback), BRAND.muted),
    }),
    text: plainText({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      lines: [intro, access, c.keep, c.changedMind, c.feedback],
      cta,
    }),
  };
}

/* ------------------------------ Recibo de pago ------------------------------- */

export type BillingInterval = 'monthly' | 'semiannual' | 'yearly' | null;

export interface PaymentReceiptData {
  amount: number;
  currency: string;
  interval: BillingInterval;
  periodStart: Date | null;
  periodEnd: Date | null;
  invoiceNumber: string | null;
  paidAt: Date;
  provider: 'Stripe' | 'PayPal';
  /** Pagina de la factura del proveedor (Stripe hosted invoice). */
  invoiceUrl: string | null;
  invoicePdfUrl: string | null;
}

export function renderPaymentReceipt(params: {
  recipient: Recipient;
  appUrl: string;
  payment: PaymentReceiptData;
}): RenderedMail {
  const locale = toMailLocale(params.recipient.locale);
  const t = MAIL_TEXT[locale];
  const r = t.paymentReceipt;
  const p = params.payment;

  const plan =
    p.interval === 'monthly'
      ? r.planMonthly
      : p.interval === 'semiannual'
        ? r.planSemiannual
        : p.interval === 'yearly'
          ? r.planYearly
          : r.planPro;
  const rows: [string, string][] = [
    [r.amount, formatMoney(p.amount, p.currency, locale)],
    [r.plan, plan],
  ];
  if (p.periodStart && p.periodEnd) {
    rows.push([
      r.period,
      `${formatDate(p.periodStart, locale)} – ${formatDate(p.periodEnd, locale)}`,
    ]);
  }
  if (p.invoiceNumber) rows.push([r.invoiceNumber, p.invoiceNumber]);
  rows.push([r.paidOn, formatDate(p.paidAt, locale)]);
  rows.push([r.method, p.provider]);

  const table = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;border:1px solid ${BRAND.border};border-radius:12px;">
  ${rows
    .map(
      ([label, value], i) => `
  <tr>
    <td style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.border};` : ''}font-size:14px;color:${BRAND.muted};">${escapeHtml(label)}</td>
    <td align="right" style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.border};` : ''}font-size:14px;color:${BRAND.text};font-weight:bold;">${escapeHtml(value)}</td>
  </tr>`,
    )
    .join('')}
</table>`;

  const providerNote = fill(r.providerNote, { provider: p.provider });
  const cta = p.invoiceUrl
    ? { label: r.invoiceCta, url: p.invoiceUrl }
    : undefined;
  const pdf = p.invoicePdfUrl
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:21px;"><a href="${escapeHtml(p.invoicePdfUrl)}" style="color:${BRAND.primary};">${escapeHtml(r.pdfLink)}</a></p>`
    : '';

  return {
    subject: p.invoiceNumber ? `${r.subject} · ${p.invoiceNumber}` : r.subject,
    html: layout({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      preheader: r.preheader,
      title: r.title,
      body: paragraph(escapeHtml(r.intro)) + table,
      cta,
      after: pdf + paragraph(escapeHtml(providerNote), BRAND.muted),
    }),
    text: plainText({
      t,
      recipient: params.recipient,
      appUrl: params.appUrl,
      lines: [
        r.intro,
        rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
        ...(p.invoicePdfUrl ? [`${r.pdfLink}: ${p.invoicePdfUrl}`] : []),
        providerNote,
      ],
      cta,
    }),
  };
}
