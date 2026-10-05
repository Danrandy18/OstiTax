/**
 * Textos de los correos en los 6 idiomas de la UI. Se envian en el idioma que el usuario usa
 * en la app (account.locale); el PDF oficial sigue siendo siempre aleman, los correos no.
 * Placeholders: {name}, {email}, {minutes}, {date}.
 */

export const MAIL_LOCALES = ['de', 'en', 'tr', 'bcs', 'es', 'uk'] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

export function toMailLocale(value: string | null | undefined): MailLocale {
  return (MAIL_LOCALES as readonly string[]).includes(value ?? '')
    ? (value as MailLocale)
    : 'de';
}

/** Locale de Intl para fechas en cada idioma. */
export const INTL_LOCALE: Record<MailLocale, string> = {
  de: 'de-AT',
  en: 'en-GB',
  tr: 'tr-TR',
  bcs: 'hr-HR',
  es: 'es-ES',
  uk: 'uk-UA',
};

export interface Feature {
  title: string;
  body: string;
}

export interface MailText {
  greetingNamed: string;
  greeting: string;
  signOff: string;
  team: string;
  footerReason: string;
  footerPrivacy: string;
  footerImprint: string;
  linkFallback: string;
  proWelcome: {
    subject: string;
    preheader: string;
    badge: string;
    title: string;
    intro: string;
    featuresTitle: string;
    features: Feature[];
    renewal: string;
    manage: string;
    cta: string;
    appTitle: string;
    appBody: string;
    playCta: string;
    iosSoon: string;
  };
  passwordReset: {
    subject: string;
    preheader: string;
    title: string;
    intro: string;
    cta: string;
    validity: string;
    ignore: string;
  };
  passwordChanged: {
    subject: string;
    preheader: string;
    title: string;
    intro: string;
    sessions: string;
    notYou: string;
    cta: string;
  };
  subscriptionCanceled: {
    subject: string;
    preheader: string;
    title: string;
    intro: string;
    accessUntil: string;
    accessEnded: string;
    keep: string;
    changedMind: string;
    cta: string;
    feedback: string;
  };
  paymentReceipt: {
    subject: string;
    preheader: string;
    title: string;
    intro: string;
    amount: string;
    plan: string;
    period: string;
    invoiceNumber: string;
    paidOn: string;
    method: string;
    planMonthly: string;
    planSemiannual: string;
    planYearly: string;
    planPro: string;
    invoiceCta: string;
    pdfLink: string;
    providerNote: string;
  };
}

export const MAIL_TEXT: Record<MailLocale, MailText> = {
  de: {
    greetingNamed: 'Hallo {name},',
    greeting: 'Hallo,',
    signOff: 'Herzliche Grüße',
    team: 'Dein ÖstiTax-Team',
    footerReason:
      'Du erhältst diese E-Mail, weil sie dein ÖstiTax-Konto ({email}) betrifft.',
    footerPrivacy: 'Datenschutz',
    footerImprint: 'Impressum',
    linkFallback:
      'Funktioniert der Button nicht? Kopiere diesen Link in deinen Browser:',
    proWelcome: {
      subject: 'Willkommen bei ÖstiTax Pro',
      preheader: 'Dein Pro-Zugang ist aktiv – das kannst du jetzt alles tun.',
      badge: 'PRO AKTIV',
      title: 'Willkommen bei ÖstiTax Pro',
      intro:
        'vielen Dank für dein Vertrauen. Dein Pro-Zugang ist ab sofort aktiv – auf der Website und in der App, mit deinem Konto {email}.',
      featuresTitle: 'Das kannst du jetzt',
      features: [
        {
          title: 'Unbegrenzte Berechnungen',
          body: 'Brutto-Netto so oft du willst, ohne Limit alle 24 Stunden.',
        },
        {
          title: 'Ausführlicher PDF-Bericht',
          body: 'Jede Position erklärt, mit Spartipps und Leitfaden – auf Deutsch, wie für das Finanzamt.',
        },
        {
          title: 'Belegscanner',
          body: 'Rechnungen fotografieren: Händler, Datum, Betrag und USt werden automatisch erkannt und einer Kategorie zugeordnet.',
        },
        {
          title: 'Export für die Arbeitnehmerveranlagung',
          body: 'Deine Belege als PDF oder CSV, mit Summen je Kategorie und der passenden L1-Kennzahl als Vorschlag.',
        },
        {
          title: 'Web und App synchron',
          body: 'Belege und Pro-Zugang sind überall verfügbar, wo du dich anmeldest.',
        },
      ],
      renewal: 'Dein Abo verlängert sich am {date}.',
      manage:
        'Du kannst dein Abo jederzeit in deinem Profil verwalten oder kündigen.',
      cta: 'ÖstiTax öffnen',
      appTitle: 'ÖstiTax auf deinem Handy',
      appBody:
        'Dein Pro-Zugang gilt auch in der App: einfach mit demselben Konto anmelden und Belege direkt mit der Kamera erfassen.',
      playCta: 'Bei Google Play laden',
      iosSoon: 'Für iPhone (iOS): demnächst verfügbar.',
    },
    passwordReset: {
      subject: 'Passwort zurücksetzen',
      preheader: 'Lege ein neues Passwort für dein ÖstiTax-Konto fest.',
      title: 'Neues Passwort festlegen',
      intro:
        'wir haben eine Anfrage erhalten, das Passwort für dein ÖstiTax-Konto ({email}) zurückzusetzen.',
      cta: 'Neues Passwort festlegen',
      validity:
        'Der Link ist {minutes} Minuten gültig und kann nur einmal verwendet werden.',
      ignore:
        'Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren – dein Passwort bleibt unverändert.',
    },
    passwordChanged: {
      subject: 'Dein Passwort wurde geändert',
      preheader: 'Sicherheitshinweis zu deinem ÖstiTax-Konto.',
      title: 'Passwort geändert',
      intro:
        'das Passwort für dein ÖstiTax-Konto ({email}) wurde am {date} geändert.',
      sessions: 'Aus Sicherheitsgründen wurden alle anderen Geräte abgemeldet.',
      notYou:
        'Warst du das nicht? Setze dein Passwort sofort zurück und antworte auf diese E-Mail, damit wir dir helfen können.',
      cta: 'Passwort zurücksetzen',
    },
    subscriptionCanceled: {
      subject: 'Dein Pro-Abo wurde gekündigt',
      preheader: 'Bestätigung deiner Kündigung bei ÖstiTax.',
      title: 'Kündigung bestätigt',
      intro:
        'wir bestätigen die Kündigung deines ÖstiTax-Pro-Abos für das Konto {email}. Es wird nichts mehr abgebucht.',
      accessUntil:
        'Deine Pro-Funktionen bleiben bis zum {date} aktiv. Danach wechselt dein Konto automatisch zu Gratis.',
      accessEnded:
        'Deine Pro-Funktionen sind ab heute beendet; dein Konto nutzt jetzt den Gratis-Tarif.',
      keep: 'Deine gespeicherten Belege bleiben erhalten: Du kannst sie weiterhin ansehen, exportieren und löschen.',
      changedMind:
        'Du hast es dir anders überlegt? Du kannst Pro jederzeit in deinem Profil wieder aktivieren.',
      cta: 'Zu meinem Profil',
      feedback:
        'Wir würden gern wissen, was wir besser machen können – antworte einfach auf diese E-Mail.',
    },
    paymentReceipt: {
      subject: 'Zahlungsbestätigung ÖstiTax Pro',
      preheader: 'Danke für deine Zahlung – hier ist deine Rechnung.',
      title: 'Danke für deine Zahlung',
      intro:
        'wir haben deine Zahlung für ÖstiTax Pro erhalten. Hier sind die Details:',
      amount: 'Betrag',
      plan: 'Tarif',
      period: 'Zeitraum',
      invoiceNumber: 'Rechnungsnummer',
      paidOn: 'Bezahlt am',
      method: 'Zahlungsart',
      planMonthly: 'Pro · monatlich',
      planSemiannual: 'Pro · halbjährlich',
      planYearly: 'Pro · jährlich',
      planPro: 'Pro',
      invoiceCta: 'Rechnung ansehen',
      pdfLink: 'Rechnung als PDF herunterladen',
      providerNote:
        'Die Zahlung wurde über {provider} abgewickelt. Bewahre diese E-Mail für deine Unterlagen auf.',
    },
  },
  en: {
    greetingNamed: 'Hello {name},',
    greeting: 'Hello,',
    signOff: 'Best regards',
    team: 'The ÖstiTax team',
    footerReason:
      'You are receiving this email because it concerns your ÖstiTax account ({email}).',
    footerPrivacy: 'Privacy',
    footerImprint: 'Legal notice',
    linkFallback: 'Button not working? Copy this link into your browser:',
    proWelcome: {
      subject: 'Welcome to ÖstiTax Pro',
      preheader:
        'Your Pro access is active – here is everything you can do now.',
      badge: 'PRO ACTIVE',
      title: 'Welcome to ÖstiTax Pro',
      intro:
        'thank you for your trust. Your Pro access is active from now on – on the website and in the app, with your account {email}.',
      featuresTitle: 'What you can do now',
      features: [
        {
          title: 'Unlimited calculations',
          body: 'Gross to net as often as you like, with no 24-hour limit.',
        },
        {
          title: 'Detailed PDF report',
          body: 'Every item explained, with saving tips and a guide – in German, ready for the tax office.',
        },
        {
          title: 'Receipt scanner',
          body: 'Photograph invoices: merchant, date, amount and VAT are recognised and sorted into a category automatically.',
        },
        {
          title: 'Export for your tax assessment',
          body: 'Your receipts as PDF or CSV, with totals per category and the matching L1 code as a suggestion.',
        },
        {
          title: 'Web and app in sync',
          body: 'Receipts and Pro access are available wherever you sign in.',
        },
      ],
      renewal: 'Your subscription renews on {date}.',
      manage:
        'You can manage or cancel your subscription at any time in your profile.',
      cta: 'Open ÖstiTax',
      appTitle: 'ÖstiTax on your phone',
      appBody:
        'Your Pro access works in the app too: just sign in with the same account and capture receipts straight from your camera.',
      playCta: 'Get it on Google Play',
      iosSoon: 'For iPhone (iOS): coming soon.',
    },
    passwordReset: {
      subject: 'Reset your password',
      preheader: 'Choose a new password for your ÖstiTax account.',
      title: 'Choose a new password',
      intro:
        'we received a request to reset the password for your ÖstiTax account ({email}).',
      cta: 'Choose a new password',
      validity:
        'The link is valid for {minutes} minutes and can only be used once.',
      ignore:
        'If you did not request this, you can ignore this email – your password stays the same.',
    },
    passwordChanged: {
      subject: 'Your password was changed',
      preheader: 'Security notice for your ÖstiTax account.',
      title: 'Password changed',
      intro:
        'the password for your ÖstiTax account ({email}) was changed on {date}.',
      sessions: 'For your security, all other devices have been signed out.',
      notYou:
        'Not you? Reset your password right away and reply to this email so we can help.',
      cta: 'Reset password',
    },
    subscriptionCanceled: {
      subject: 'Your Pro subscription has been cancelled',
      preheader: 'Confirmation of your ÖstiTax cancellation.',
      title: 'Cancellation confirmed',
      intro:
        'we confirm the cancellation of your ÖstiTax Pro subscription for the account {email}. You will not be charged again.',
      accessUntil:
        'Your Pro features stay active until {date}. After that your account switches to Free automatically.',
      accessEnded:
        'Your Pro features ended today; your account now uses the Free plan.',
      keep: 'Your saved receipts are kept: you can still view, export and delete them.',
      changedMind:
        'Changed your mind? You can reactivate Pro at any time in your profile.',
      cta: 'Go to my profile',
      feedback:
        'We would love to know what we could do better – just reply to this email.',
    },
    paymentReceipt: {
      subject: 'Payment confirmation ÖstiTax Pro',
      preheader: 'Thank you for your payment – here is your invoice.',
      title: 'Thank you for your payment',
      intro:
        'we have received your payment for ÖstiTax Pro. Here are the details:',
      amount: 'Amount',
      plan: 'Plan',
      period: 'Period',
      invoiceNumber: 'Invoice number',
      paidOn: 'Paid on',
      method: 'Payment method',
      planMonthly: 'Pro · monthly',
      planSemiannual: 'Pro · every 6 months',
      planYearly: 'Pro · yearly',
      planPro: 'Pro',
      invoiceCta: 'View invoice',
      pdfLink: 'Download the invoice as PDF',
      providerNote:
        'The payment was processed by {provider}. Keep this email for your records.',
    },
  },
  tr: {
    greetingNamed: 'Merhaba {name},',
    greeting: 'Merhaba,',
    signOff: 'Saygılarımızla',
    team: 'ÖstiTax ekibi',
    footerReason:
      'Bu e-postayı ÖstiTax hesabınızla ({email}) ilgili olduğu için alıyorsunuz.',
    footerPrivacy: 'Gizlilik',
    footerImprint: 'Künye',
    linkFallback: 'Düğme çalışmıyor mu? Bu bağlantıyı tarayıcınıza kopyalayın:',
    proWelcome: {
      subject: 'ÖstiTax Pro’ya hoş geldiniz',
      preheader: 'Pro erişiminiz aktif – artık yapabilecekleriniz burada.',
      badge: 'PRO AKTİF',
      title: 'ÖstiTax Pro’ya hoş geldiniz',
      intro:
        'güveniniz için teşekkür ederiz. Pro erişiminiz şu andan itibaren aktif – web sitesinde ve uygulamada, {email} hesabınızla.',
      featuresTitle: 'Artık yapabilecekleriniz',
      features: [
        {
          title: 'Sınırsız hesaplama',
          body: '24 saatlik sınır olmadan, istediğiniz kadar brütten nete hesaplama.',
        },
        {
          title: 'Ayrıntılı PDF raporu',
          body: 'Her kalem açıklamalı, tasarruf ipuçları ve rehberle – vergi dairesi için Almanca.',
        },
        {
          title: 'Fiş tarayıcı',
          body: 'Faturaları fotoğraflayın: satıcı, tarih, tutar ve KDV otomatik tanınır ve bir kategoriye atanır.',
        },
        {
          title: 'Vergi beyanı için dışa aktarma',
          body: 'Fişleriniz PDF veya CSV olarak, kategori toplamları ve önerilen L1 koduyla.',
        },
        {
          title: 'Web ve uygulama senkron',
          body: 'Fişleriniz ve Pro erişiminiz giriş yaptığınız her yerde kullanılabilir.',
        },
      ],
      renewal: 'Aboneliğiniz {date} tarihinde yenilenir.',
      manage:
        'Aboneliğinizi istediğiniz zaman profilinizden yönetebilir veya iptal edebilirsiniz.',
      cta: 'ÖstiTax’i aç',
      appTitle: 'ÖstiTax cebinizde',
      appBody:
        'Pro erişiminiz uygulamada da geçerli: aynı hesapla giriş yapın ve fişleri doğrudan kameranızla kaydedin.',
      playCta: 'Google Play’den indirin',
      iosSoon: 'iPhone (iOS) için: çok yakında.',
    },
    passwordReset: {
      subject: 'Şifrenizi sıfırlayın',
      preheader: 'ÖstiTax hesabınız için yeni bir şifre belirleyin.',
      title: 'Yeni şifre belirleyin',
      intro: 'ÖstiTax hesabınızın ({email}) şifresini sıfırlama talebi aldık.',
      cta: 'Yeni şifre belirle',
      validity:
        'Bağlantı {minutes} dakika geçerlidir ve yalnızca bir kez kullanılabilir.',
      ignore:
        'Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz – şifreniz değişmez.',
    },
    passwordChanged: {
      subject: 'Şifreniz değiştirildi',
      preheader: 'ÖstiTax hesabınız için güvenlik bildirimi.',
      title: 'Şifre değiştirildi',
      intro:
        'ÖstiTax hesabınızın ({email}) şifresi {date} tarihinde değiştirildi.',
      sessions: 'Güvenliğiniz için diğer tüm cihazlarda oturum kapatıldı.',
      notYou:
        'Bu siz değil miydiniz? Şifrenizi hemen sıfırlayın ve size yardımcı olabilmemiz için bu e-postayı yanıtlayın.',
      cta: 'Şifreyi sıfırla',
    },
    subscriptionCanceled: {
      subject: 'Pro aboneliğiniz iptal edildi',
      preheader: 'ÖstiTax iptal onayınız.',
      title: 'İptal onaylandı',
      intro:
        '{email} hesabı için ÖstiTax Pro aboneliğinizin iptalini onaylıyoruz. Artık ücret alınmayacak.',
      accessUntil:
        'Pro özellikleriniz {date} tarihine kadar aktif kalır. Ardından hesabınız otomatik olarak Ücretsiz plana geçer.',
      accessEnded:
        'Pro özellikleriniz bugün sona erdi; hesabınız artık Ücretsiz planı kullanıyor.',
      keep: 'Kayıtlı fişleriniz korunur: onları görüntülemeye, dışa aktarmaya ve silmeye devam edebilirsiniz.',
      changedMind:
        'Fikrinizi mi değiştirdiniz? Pro’yu istediğiniz zaman profilinizden yeniden etkinleştirebilirsiniz.',
      cta: 'Profilime git',
      feedback:
        'Neyi daha iyi yapabileceğimizi bilmek isteriz – bu e-postayı yanıtlamanız yeterli.',
    },
    paymentReceipt: {
      subject: 'ÖstiTax Pro ödeme onayı',
      preheader: 'Ödemeniz için teşekkürler – faturanız burada.',
      title: 'Ödemeniz için teşekkürler',
      intro: 'ÖstiTax Pro ödemenizi aldık. Ayrıntılar:',
      amount: 'Tutar',
      plan: 'Plan',
      period: 'Dönem',
      invoiceNumber: 'Fatura numarası',
      paidOn: 'Ödeme tarihi',
      method: 'Ödeme yöntemi',
      planMonthly: 'Pro · aylık',
      planSemiannual: 'Pro · 6 aylık',
      planYearly: 'Pro · yıllık',
      planPro: 'Pro',
      invoiceCta: 'Faturayı görüntüle',
      pdfLink: 'Faturayı PDF olarak indir',
      providerNote:
        'Ödeme {provider} üzerinden işlendi. Bu e-postayı kayıtlarınız için saklayın.',
    },
  },
  bcs: {
    greetingNamed: 'Zdravo {name},',
    greeting: 'Zdravo,',
    signOff: 'Srdačan pozdrav',
    team: 'Tvoj ÖstiTax tim',
    footerReason:
      'Ovu e-poruku dobijaš jer se odnosi na tvoj ÖstiTax nalog ({email}).',
    footerPrivacy: 'Privatnost',
    footerImprint: 'Impressum',
    linkFallback: 'Dugme ne radi? Kopiraj ovaj link u preglednik:',
    proWelcome: {
      subject: 'Dobro došao/la u ÖstiTax Pro',
      preheader: 'Tvoj Pro pristup je aktivan – evo šta sada sve možeš.',
      badge: 'PRO AKTIVAN',
      title: 'Dobro došao/la u ÖstiTax Pro',
      intro:
        'hvala na povjerenju. Tvoj Pro pristup je aktivan od sada – na web stranici i u aplikaciji, s nalogom {email}.',
      featuresTitle: 'Šta sada možeš',
      features: [
        {
          title: 'Neograničeni izračuni',
          body: 'Bruto u neto koliko god želiš, bez ograničenja od 24 sata.',
        },
        {
          title: 'Detaljan PDF izvještaj',
          body: 'Svaka stavka objašnjena, sa savjetima za uštedu i vodičem – na njemačkom, spremno za poreznu upravu.',
        },
        {
          title: 'Skener računa',
          body: 'Fotografiši račune: trgovac, datum, iznos i PDV se automatski prepoznaju i razvrstavaju po kategoriji.',
        },
        {
          title: 'Izvoz za poreznu prijavu',
          body: 'Tvoji računi kao PDF ili CSV, sa zbirovima po kategoriji i predloženom L1 šifrom.',
        },
        {
          title: 'Web i aplikacija usklađeni',
          body: 'Računi i Pro pristup dostupni su gdje god se prijaviš.',
        },
      ],
      renewal: 'Tvoja pretplata se obnavlja {date}.',
      manage:
        'Pretplatu možeš u svakom trenutku upravljati ili otkazati u svom profilu.',
      cta: 'Otvori ÖstiTax',
      appTitle: 'ÖstiTax na tvom mobitelu',
      appBody:
        'Tvoj Pro pristup vrijedi i u aplikaciji: prijavi se istim nalogom i snimaj račune direktno kamerom.',
      playCta: 'Preuzmi na Google Play',
      iosSoon: 'Za iPhone (iOS): uskoro.',
    },
    passwordReset: {
      subject: 'Resetuj lozinku',
      preheader: 'Postavi novu lozinku za svoj ÖstiTax nalog.',
      title: 'Postavi novu lozinku',
      intro:
        'primili smo zahtjev za resetovanje lozinke za tvoj ÖstiTax nalog ({email}).',
      cta: 'Postavi novu lozinku',
      validity:
        'Link vrijedi {minutes} minuta i može se iskoristiti samo jednom.',
      ignore:
        'Ako nisi ti poslao/la zahtjev, slobodno ignoriši ovu e-poruku – lozinka ostaje ista.',
    },
    passwordChanged: {
      subject: 'Tvoja lozinka je promijenjena',
      preheader: 'Sigurnosno obavještenje za tvoj ÖstiTax nalog.',
      title: 'Lozinka promijenjena',
      intro: 'lozinka za tvoj ÖstiTax nalog ({email}) promijenjena je {date}.',
      sessions: 'Radi sigurnosti odjavljeni su svi ostali uređaji.',
      notYou:
        'Nisi bio/la ti? Odmah resetuj lozinku i odgovori na ovu e-poruku da ti možemo pomoći.',
      cta: 'Resetuj lozinku',
    },
    subscriptionCanceled: {
      subject: 'Tvoja Pro pretplata je otkazana',
      preheader: 'Potvrda otkazivanja za ÖstiTax.',
      title: 'Otkazivanje potvrđeno',
      intro:
        'potvrđujemo otkazivanje tvoje ÖstiTax Pro pretplate za nalog {email}. Više ti se ništa neće naplaćivati.',
      accessUntil:
        'Tvoje Pro funkcije ostaju aktivne do {date}. Nakon toga nalog automatski prelazi na besplatni paket.',
      accessEnded:
        'Tvoje Pro funkcije su danas završene; nalog sada koristi besplatni paket.',
      keep: 'Tvoji sačuvani računi ostaju: i dalje ih možeš pregledati, izvesti i izbrisati.',
      changedMind:
        'Predomislio/la si se? Pro možeš u svakom trenutku ponovo aktivirati u svom profilu.',
      cta: 'Idi na moj profil',
      feedback:
        'Voljeli bismo znati šta možemo poboljšati – samo odgovori na ovu e-poruku.',
    },
    paymentReceipt: {
      subject: 'Potvrda plaćanja ÖstiTax Pro',
      preheader: 'Hvala na uplati – evo tvoje fakture.',
      title: 'Hvala na uplati',
      intro: 'primili smo tvoju uplatu za ÖstiTax Pro. Evo detalja:',
      amount: 'Iznos',
      plan: 'Paket',
      period: 'Period',
      invoiceNumber: 'Broj fakture',
      paidOn: 'Plaćeno',
      method: 'Način plaćanja',
      planMonthly: 'Pro · mjesečno',
      planSemiannual: 'Pro · polugodišnje',
      planYearly: 'Pro · godišnje',
      planPro: 'Pro',
      invoiceCta: 'Pogledaj fakturu',
      pdfLink: 'Preuzmi fakturu kao PDF',
      providerNote:
        'Uplata je obrađena preko {provider}. Sačuvaj ovu e-poruku za svoju evidenciju.',
    },
  },
  es: {
    greetingNamed: 'Hola, {name}:',
    greeting: 'Hola:',
    signOff: 'Un saludo cordial',
    team: 'El equipo de ÖstiTax',
    footerReason:
      'Recibes este correo porque se refiere a tu cuenta de ÖstiTax ({email}).',
    footerPrivacy: 'Privacidad',
    footerImprint: 'Aviso legal',
    linkFallback: '¿El botón no funciona? Copia este enlace en tu navegador:',
    proWelcome: {
      subject: 'Bienvenido/a a ÖstiTax Pro',
      preheader:
        'Tu acceso Pro ya está activo: esto es todo lo que puedes hacer ahora.',
      badge: 'PRO ACTIVO',
      title: 'Bienvenido/a a ÖstiTax Pro',
      intro:
        'gracias por tu confianza. Tu acceso Pro ya está activo, en la web y en la app, con tu cuenta {email}.',
      featuresTitle: 'Lo que ahora puedes hacer',
      features: [
        {
          title: 'Cálculos ilimitados',
          body: 'De bruto a neto tantas veces como quieras, sin el límite de 24 horas.',
        },
        {
          title: 'Informe PDF completo',
          body: 'Cada concepto explicado, con consejos de ahorro y una guía, en alemán, listo para Hacienda.',
        },
        {
          title: 'Escáner de recibos',
          body: 'Fotografía tus facturas: comercio, fecha, importe e IVA se reconocen y se clasifican por categoría automáticamente.',
        },
        {
          title: 'Exportación para la declaración',
          body: 'Tus recibos en PDF o CSV, con totales por categoría y la casilla L1 sugerida (Arbeitnehmerveranlagung).',
        },
        {
          title: 'Web y app sincronizadas',
          body: 'Tus recibos y tu acceso Pro están disponibles donde inicies sesión.',
        },
      ],
      renewal: 'Tu suscripción se renueva el {date}.',
      manage:
        'Puedes gestionar o cancelar tu suscripción cuando quieras desde tu perfil.',
      cta: 'Abrir ÖstiTax',
      appTitle: 'ÖstiTax en tu móvil',
      appBody:
        'Tu acceso Pro también funciona en la app: inicia sesión con la misma cuenta y escanea tus recibos directamente con la cámara.',
      playCta: 'Descárgala en Google Play',
      iosSoon: 'Para iPhone (iOS): próximamente.',
    },
    passwordReset: {
      subject: 'Restablece tu contraseña',
      preheader: 'Elige una nueva contraseña para tu cuenta de ÖstiTax.',
      title: 'Elige una nueva contraseña',
      intro:
        'hemos recibido una solicitud para restablecer la contraseña de tu cuenta de ÖstiTax ({email}).',
      cta: 'Elegir nueva contraseña',
      validity:
        'El enlace es válido durante {minutes} minutos y solo se puede usar una vez.',
      ignore:
        'Si no lo has solicitado tú, puedes ignorar este correo: tu contraseña no cambiará.',
    },
    passwordChanged: {
      subject: 'Tu contraseña se ha cambiado',
      preheader: 'Aviso de seguridad de tu cuenta de ÖstiTax.',
      title: 'Contraseña cambiada',
      intro:
        'la contraseña de tu cuenta de ÖstiTax ({email}) se cambió el {date}.',
      sessions:
        'Por seguridad, hemos cerrado la sesión en todos los demás dispositivos.',
      notYou:
        '¿No has sido tú? Restablece tu contraseña ahora mismo y responde a este correo para que podamos ayudarte.',
      cta: 'Restablecer contraseña',
    },
    subscriptionCanceled: {
      subject: 'Tu suscripción Pro se ha cancelado',
      preheader: 'Confirmación de tu cancelación en ÖstiTax.',
      title: 'Cancelación confirmada',
      intro:
        'confirmamos la cancelación de tu suscripción a ÖstiTax Pro de la cuenta {email}. No se te volverá a cobrar.',
      accessUntil:
        'Tus funciones Pro siguen activas hasta el {date}. Después, tu cuenta pasará automáticamente al plan Gratis.',
      accessEnded:
        'Tus funciones Pro han terminado hoy; tu cuenta usa ahora el plan Gratis.',
      keep: 'Tus recibos guardados se conservan: puedes seguir viéndolos, exportándolos y borrándolos.',
      changedMind:
        '¿Has cambiado de idea? Puedes reactivar Pro cuando quieras desde tu perfil.',
      cta: 'Ir a mi perfil',
      feedback:
        'Nos encantaría saber qué podemos mejorar: solo tienes que responder a este correo.',
    },
    paymentReceipt: {
      subject: 'Confirmación de pago de ÖstiTax Pro',
      preheader: 'Gracias por tu pago: aquí tienes tu factura.',
      title: 'Gracias por tu pago',
      intro: 'hemos recibido tu pago de ÖstiTax Pro. Estos son los detalles:',
      amount: 'Importe',
      plan: 'Plan',
      period: 'Periodo',
      invoiceNumber: 'Número de factura',
      paidOn: 'Pagado el',
      method: 'Forma de pago',
      planMonthly: 'Pro · mensual',
      planSemiannual: 'Pro · semestral',
      planYearly: 'Pro · anual',
      planPro: 'Pro',
      invoiceCta: 'Ver factura',
      pdfLink: 'Descargar la factura en PDF',
      providerNote:
        'El pago se procesó a través de {provider}. Guarda este correo para tus registros.',
    },
  },
  uk: {
    greetingNamed: 'Вітаємо, {name}!',
    greeting: 'Вітаємо!',
    signOff: 'З найкращими побажаннями',
    team: 'Команда ÖstiTax',
    footerReason:
      'Ви отримали цей лист, бо він стосується вашого акаунта ÖstiTax ({email}).',
    footerPrivacy: 'Конфіденційність',
    footerImprint: 'Вихідні дані',
    linkFallback: 'Кнопка не працює? Скопіюйте це посилання в браузер:',
    proWelcome: {
      subject: 'Ласкаво просимо до ÖstiTax Pro',
      preheader: 'Ваш доступ Pro активний – ось що ви тепер можете.',
      badge: 'PRO АКТИВНИЙ',
      title: 'Ласкаво просимо до ÖstiTax Pro',
      intro:
        'дякуємо за довіру. Ваш доступ Pro активний відтепер – на сайті та в застосунку, з акаунтом {email}.',
      featuresTitle: 'Що ви тепер можете',
      features: [
        {
          title: 'Необмежені розрахунки',
          body: 'Брутто в нетто скільки завгодно, без ліміту на 24 години.',
        },
        {
          title: 'Детальний PDF-звіт',
          body: 'Кожна позиція з поясненням, порадами щодо заощадження та посібником – німецькою, як для податкової.',
        },
        {
          title: 'Сканер чеків',
          body: 'Фотографуйте рахунки: продавець, дата, сума та ПДВ розпізнаються й розподіляються за категоріями автоматично.',
        },
        {
          title: 'Експорт для податкової декларації',
          body: 'Ваші чеки у PDF або CSV, із сумами за категоріями та запропонованим кодом L1.',
        },
        {
          title: 'Сайт і застосунок синхронізовані',
          body: 'Чеки та доступ Pro доступні всюди, де ви входите в акаунт.',
        },
      ],
      renewal: 'Ваша підписка поновиться {date}.',
      manage:
        'Керувати підпискою або скасувати її можна будь-коли у вашому профілі.',
      cta: 'Відкрити ÖstiTax',
      appTitle: 'ÖstiTax у вашому телефоні',
      appBody:
        'Доступ Pro працює і в застосунку: увійдіть з тим самим акаунтом і скануйте чеки камерою.',
      playCta: 'Завантажити з Google Play',
      iosSoon: 'Для iPhone (iOS): незабаром.',
    },
    passwordReset: {
      subject: 'Скидання пароля',
      preheader: 'Створіть новий пароль для акаунта ÖstiTax.',
      title: 'Створіть новий пароль',
      intro:
        'ми отримали запит на скидання пароля для вашого акаунта ÖstiTax ({email}).',
      cta: 'Створити новий пароль',
      validity:
        'Посилання дійсне {minutes} хвилин і може бути використане лише один раз.',
      ignore:
        'Якщо ви цього не запитували, просто проігноруйте цей лист – пароль не зміниться.',
    },
    passwordChanged: {
      subject: 'Ваш пароль змінено',
      preheader: 'Повідомлення безпеки для вашого акаунта ÖstiTax.',
      title: 'Пароль змінено',
      intro: 'пароль вашого акаунта ÖstiTax ({email}) було змінено {date}.',
      sessions:
        'З міркувань безпеки ми вийшли з акаунта на всіх інших пристроях.',
      notYou:
        'Це були не ви? Негайно скиньте пароль і дайте відповідь на цей лист, щоб ми могли допомогти.',
      cta: 'Скинути пароль',
    },
    subscriptionCanceled: {
      subject: 'Вашу підписку Pro скасовано',
      preheader: 'Підтвердження скасування в ÖstiTax.',
      title: 'Скасування підтверджено',
      intro:
        'підтверджуємо скасування підписки ÖstiTax Pro для акаунта {email}. Більше коштів не буде списано.',
      accessUntil:
        'Функції Pro залишаються активними до {date}. Після цього акаунт автоматично перейде на безкоштовний тариф.',
      accessEnded:
        'Функції Pro завершилися сьогодні; акаунт тепер використовує безкоштовний тариф.',
      keep: 'Ваші збережені чеки залишаються: ви й надалі можете переглядати, експортувати та видаляти їх.',
      changedMind:
        'Передумали? Pro можна будь-коли знову активувати у вашому профілі.',
      cta: 'Перейти до профілю',
      feedback:
        'Нам важливо знати, що ми можемо покращити, – просто дайте відповідь на цей лист.',
    },
    paymentReceipt: {
      subject: 'Підтвердження оплати ÖstiTax Pro',
      preheader: 'Дякуємо за оплату – ось ваш рахунок.',
      title: 'Дякуємо за оплату',
      intro: 'ми отримали вашу оплату за ÖstiTax Pro. Деталі:',
      amount: 'Сума',
      plan: 'Тариф',
      period: 'Період',
      invoiceNumber: 'Номер рахунку',
      paidOn: 'Оплачено',
      method: 'Спосіб оплати',
      planMonthly: 'Pro · щомісяця',
      planSemiannual: 'Pro · раз на 6 місяців',
      planYearly: 'Pro · щороку',
      planPro: 'Pro',
      invoiceCta: 'Переглянути рахунок',
      pdfLink: 'Завантажити рахунок у PDF',
      providerNote:
        'Оплату оброблено через {provider}. Збережіть цей лист для своїх записів.',
    },
  },
};
