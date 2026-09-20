import type { Lang } from '../i18n/translations';

export type LegalDocId = 'privacy' | 'impressum' | 'deleteAccount';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
}

/**
 * Textos legales por idioma. Placeholders: {owner}, {trade}, {address}, {email}, {domain}.
 * El aleman es la version de referencia; el resto son traducciones de cortesia.
 * Los textos describen lo que el backend hace de verdad (ver README): no anadir promesas.
 */
export const LEGAL_CONTENT: Record<Lang, Record<LegalDocId, LegalDoc>> = {
  de: {
    privacy: {
      title: 'Datenschutzerklärung',
      updatedLabel: 'Stand',
      sections: [
        {
          heading: 'Verantwortlicher',
          body: ['{owner}, Handelsname {trade}, {address}. Kontakt: {email}.'],
        },
        {
          heading: 'Welche Daten wir verarbeiten',
          body: [
            'Ohne Konto: eine zufällige Geräte-Kennung und ein Zähler für deine kostenlosen Berechnungen.',
            'Deine Eingaben im Rechner (z. B. Bruttogehalt) werden nur zur Berechnung verarbeitet und nicht gespeichert.',
            'Mit Konto: E-Mail-Adresse, optional dein Name, dein Passwort (nur als Hash, nie im Klartext) und bei Anmeldung mit Google die Google-Kennung.',
            'Bei einem Pro-Abo: Tarif, Status und Laufzeit sowie die Kunden- und Abo-Kennungen von Stripe bzw. PayPal. Karten- oder PayPal-Zugangsdaten erhalten wir nicht.',
            'Beim Aufruf entstehen technische Server-Protokolle (IP-Adresse, Zeitpunkt, aufgerufene Seite).',
          ],
        },
        {
          heading: 'Zwecke und Rechtsgrundlagen',
          body: [
            'Bereitstellung des Rechners, deines Kontos und deines Abos (Art. 6 Abs. 1 lit. b DSGVO).',
            'Sicherheit, Missbrauchsschutz und Begrenzung der kostenlosen Berechnungen (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).',
            'Erfüllung gesetzlicher Aufbewahrungspflichten für Zahlungen (Art. 6 Abs. 1 lit. c DSGVO).',
            'Das Google-Anmeldeskript wird beim Aufruf der Website geladen; Daten aus deinem Google-Konto verarbeiten wir nur, wenn du dich mit Google anmeldest.',
          ],
        },
        {
          heading: 'Empfänger und Dienstleister',
          body: [
            'Hosting: Render (Rechenzentrum Frankfurt, Deutschland).',
            'Zahlungen: Stripe Payments Europe Ltd. (Irland) und PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxemburg).',
            'Anmeldung und Schriftart: Google (Google Sign-In, Google Fonts). Beim Laden dieser Ressourcen wird deine IP-Adresse an Google übermittelt.',
            'Domain und DNS: DonDominio (Spanien).',
            'Einzelne Dienstleister können Daten in Drittländern (z. B. USA) verarbeiten; dann stützen wir uns auf Standardvertragsklauseln.',
          ],
        },
        {
          heading: 'Speicherung im Browser und in der App',
          body: [
            'Wir speichern lokal nur, was der Dienst braucht: Geräte-Kennung, Anmelde-Token und deine Spracheinstellung. Es gibt kein Tracking und keine Werbung.',
          ],
        },
        {
          heading: 'Speicherdauer',
          body: [
            'Kontodaten bleiben bis zur Löschung deines Kontos gespeichert. Zahlungsbelege bewahren Stripe und PayPal nach den gesetzlichen Fristen auf.',
            'Server-Protokolle werden vom Hosting-Anbieter nur für begrenzte Zeit aufbewahrt.',
          ],
        },
        {
          heading: 'Deine Rechte',
          body: [
            'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Schreibe uns an {email}.',
            'Dein Konto kannst du auch selbst löschen: siehe die Seite „Konto löschen“.',
          ],
        },
        {
          heading: 'Beschwerde',
          body: [
            'Du kannst dich bei der österreichischen Datenschutzbehörde beschweren: www.dsb.gv.at.',
          ],
        },
        {
          heading: 'Änderungen',
          body: [
            'Wir passen diese Erklärung an, wenn sich der Dienst ändert. Es gilt die jeweils hier veröffentlichte Fassung.',
          ],
        },
      ],
    },
    impressum: {
      title: 'Impressum',
      updatedLabel: 'Stand',
      sections: [
        {
          heading: 'Diensteanbieter',
          body: ['{owner}, Einzelunternehmer, Handelsname {trade}', '{address}', 'E-Mail: {email}'],
        },
        {
          heading: 'Unternehmensgegenstand',
          body: [
            'Entwicklung und Betrieb von Software, insbesondere eines Online-Rechners für das Nettogehalt in Österreich ({domain}).',
          ],
        },
        {
          heading: 'Haftungsausschluss',
          body: [
            'Die Berechnungen sind unverbindlich und ersetzen keine Steuer- oder Rechtsberatung. Trotz sorgfältiger Prüfung übernehmen wir keine Gewähr für Richtigkeit und Vollständigkeit; maßgeblich sind die Bescheide der Finanzverwaltung.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Konto löschen',
      updatedLabel: 'Stand',
      sections: [
        {
          heading: 'In der App oder auf der Website',
          body: [
            'Melde dich an, öffne dein Profil und wähle „Konto löschen“. Bestätige die Frage: dein Konto wird sofort gelöscht.',
            'Ein aktives Abo wird dabei beendet.',
          ],
        },
        {
          heading: 'Per E-Mail',
          body: [
            'Wenn du dich nicht mehr anmelden kannst, schreibe von deiner Konto-E-Mail-Adresse an {email} mit dem Betreff „Konto löschen“. Wir löschen dein Konto innerhalb eines Monats.',
          ],
        },
        {
          heading: 'Was gelöscht wird',
          body: [
            'Gelöscht werden E-Mail-Adresse, Name, Passwort-Hash, Google-Kennung und die Verknüpfung mit deinem Abo.',
          ],
        },
        {
          heading: 'Was bleibt',
          body: [
            'Der anonyme Zähler deines Geräts (ohne Name und E-Mail) kann bestehen bleiben.',
            'Zahlungsbelege werden von Stripe und PayPal nach den gesetzlichen Aufbewahrungsfristen gespeichert; darauf haben wir keinen Einfluss.',
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy policy',
      updatedLabel: 'Last updated',
      sections: [
        {
          heading: 'Controller',
          body: ['{owner}, trading as {trade}, {address}. Contact: {email}.'],
        },
        {
          heading: 'Data we process',
          body: [
            'Without an account: a random device identifier and a counter of your free calculations.',
            'What you enter in the calculator (for example gross salary) is only used to compute the result and is not stored.',
            'With an account: email address, optionally your name, your password (only as a hash, never in plain text) and, if you sign in with Google, your Google identifier.',
            'With a Pro subscription: plan, status and period, plus the customer and subscription identifiers from Stripe or PayPal. We do not receive card or PayPal login details.',
            'When you visit, technical server logs are created (IP address, time, requested page).',
          ],
        },
        {
          heading: 'Purposes and legal bases',
          body: [
            'Providing the calculator, your account and your subscription (Art. 6(1)(b) GDPR).',
            'Security, abuse prevention and limiting free calculations (legitimate interest, Art. 6(1)(f) GDPR).',
            'Meeting legal retention duties for payments (Art. 6(1)(c) GDPR).',
            'The Google sign-in script loads with the website; we only process data from your Google account if you sign in with Google.',
          ],
        },
        {
          heading: 'Recipients and service providers',
          body: [
            'Hosting: Render (Frankfurt data centre, Germany).',
            'Payments: Stripe Payments Europe Ltd. (Ireland) and PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxembourg).',
            'Sign-in and font: Google (Google Sign-In, Google Fonts). Loading these resources sends your IP address to Google.',
            'Domain and DNS: DonDominio (Spain).',
            'Some providers may process data in third countries (for example the USA); we then rely on standard contractual clauses.',
          ],
        },
        {
          heading: 'Storage in your browser and in the app',
          body: [
            'We only store locally what the service needs: device identifier, sign-in token and your language setting. There is no tracking and no advertising.',
          ],
        },
        {
          heading: 'Retention',
          body: [
            'Account data is kept until you delete your account. Stripe and PayPal keep payment records for the legal periods.',
            'Server logs are kept by the hosting provider for a limited time only.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            'You have the right of access, rectification, erasure, restriction of processing, data portability and objection. Write to {email}.',
            'You can also delete your account yourself: see the “Delete account” page.',
          ],
        },
        {
          heading: 'Complaints',
          body: [
            'You can lodge a complaint with the Austrian Data Protection Authority: www.dsb.gv.at.',
          ],
        },
        {
          heading: 'Changes',
          body: [
            'We update this policy when the service changes. The version published here applies.',
          ],
        },
      ],
    },
    impressum: {
      title: 'Legal notice',
      updatedLabel: 'Last updated',
      sections: [
        {
          heading: 'Service provider',
          body: ['{owner}, sole trader, trading as {trade}', '{address}', 'Email: {email}'],
        },
        {
          heading: 'Business purpose',
          body: [
            'Development and operation of software, in particular an online net salary calculator for Austria ({domain}).',
          ],
        },
        {
          heading: 'Disclaimer',
          body: [
            'The calculations are non-binding and do not replace tax or legal advice. Despite careful checks we give no guarantee of accuracy or completeness; the tax authority’s assessments prevail.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Delete account',
      updatedLabel: 'Last updated',
      sections: [
        {
          heading: 'In the app or on the website',
          body: [
            'Sign in, open your profile and choose “Delete account”. Confirm the question: your account is deleted immediately.',
            'An active subscription is cancelled as part of this.',
          ],
        },
        {
          heading: 'By email',
          body: [
            'If you can no longer sign in, write from your account email address to {email} with the subject “Delete account”. We delete your account within one month.',
          ],
        },
        {
          heading: 'What is deleted',
          body: [
            'Your email address, name, password hash, Google identifier and the link to your subscription are deleted.',
          ],
        },
        {
          heading: 'What remains',
          body: [
            'The anonymous counter of your device (without name or email) may remain.',
            'Payment records are kept by Stripe and PayPal for the legal retention periods; we have no influence over that.',
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: 'Política de privacidad',
      updatedLabel: 'Última actualización',
      sections: [
        {
          heading: 'Responsable',
          body: ['{owner}, con nombre comercial {trade}, {address}. Contacto: {email}.'],
        },
        {
          heading: 'Qué datos tratamos',
          body: [
            'Sin cuenta: un identificador aleatorio del dispositivo y un contador de tus cálculos gratuitos.',
            'Lo que introduces en la calculadora (por ejemplo, el salario bruto) solo se usa para calcular el resultado y no se guarda.',
            'Con cuenta: correo electrónico, opcionalmente tu nombre, tu contraseña (solo como hash, nunca en texto plano) y, si entras con Google, el identificador de Google.',
            'Con una suscripción Pro: plan, estado y periodo, y los identificadores de cliente y suscripción de Stripe o PayPal. No recibimos datos de tarjeta ni de acceso a PayPal.',
            'Al visitar la web se generan registros técnicos del servidor (dirección IP, hora, página solicitada).',
          ],
        },
        {
          heading: 'Finalidades y bases legales',
          body: [
            'Prestar la calculadora, tu cuenta y tu suscripción (art. 6.1.b RGPD).',
            'Seguridad, prevención de abusos y limitación de los cálculos gratuitos (interés legítimo, art. 6.1.f RGPD).',
            'Cumplir las obligaciones legales de conservación de pagos (art. 6.1.c RGPD).',
            'El script de inicio de sesión de Google se carga con la web; solo tratamos datos de tu cuenta de Google si entras con Google.',
          ],
        },
        {
          heading: 'Destinatarios y proveedores',
          body: [
            'Alojamiento: Render (centro de datos de Fráncfort, Alemania).',
            'Pagos: Stripe Payments Europe Ltd. (Irlanda) y PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxemburgo).',
            'Inicio de sesión y tipografía: Google (Google Sign-In, Google Fonts). Al cargar estos recursos se envía tu dirección IP a Google.',
            'Dominio y DNS: DonDominio (España).',
            'Algunos proveedores pueden tratar datos en terceros países (por ejemplo, EE. UU.); en ese caso nos apoyamos en cláusulas contractuales tipo.',
          ],
        },
        {
          heading: 'Almacenamiento en tu navegador y en la app',
          body: [
            'Solo guardamos en local lo que el servicio necesita: identificador del dispositivo, token de sesión y tu idioma. No hay seguimiento ni publicidad.',
          ],
        },
        {
          heading: 'Conservación',
          body: [
            'Los datos de la cuenta se conservan hasta que la elimines. Stripe y PayPal conservan los justificantes de pago durante los plazos legales.',
            'Los registros del servidor los conserva el proveedor de alojamiento solo durante un tiempo limitado.',
          ],
        },
        {
          heading: 'Tus derechos',
          body: [
            'Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición. Escríbenos a {email}.',
            'También puedes eliminar tu cuenta tú mismo: consulta la página «Eliminar cuenta».',
          ],
        },
        {
          heading: 'Reclamaciones',
          body: [
            'Puedes presentar una reclamación ante la Autoridad austriaca de Protección de Datos: www.dsb.gv.at.',
          ],
        },
        {
          heading: 'Cambios',
          body: [
            'Actualizamos esta política cuando el servicio cambia. Rige la versión publicada aquí.',
          ],
        },
      ],
    },
    impressum: {
      title: 'Aviso legal',
      updatedLabel: 'Última actualización',
      sections: [
        {
          heading: 'Prestador del servicio',
          body: ['{owner}, autónomo, con nombre comercial {trade}', '{address}', 'Correo: {email}'],
        },
        {
          heading: 'Objeto de la actividad',
          body: [
            'Desarrollo y explotación de software, en particular una calculadora online de salario neto para Austria ({domain}).',
          ],
        },
        {
          heading: 'Exención de responsabilidad',
          body: [
            'Los cálculos no son vinculantes y no sustituyen el asesoramiento fiscal ni jurídico. A pesar de las comprobaciones, no garantizamos su exactitud ni integridad; prevalecen las liquidaciones de la administración tributaria.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Eliminar cuenta',
      updatedLabel: 'Última actualización',
      sections: [
        {
          heading: 'En la app o en la web',
          body: [
            'Inicia sesión, abre tu perfil y elige «Eliminar cuenta». Confirma la pregunta: tu cuenta se elimina de inmediato.',
            'Si tienes una suscripción activa, se cancela.',
          ],
        },
        {
          heading: 'Por correo electrónico',
          body: [
            'Si ya no puedes iniciar sesión, escribe desde el correo de tu cuenta a {email} con el asunto «Eliminar cuenta». Eliminamos tu cuenta en el plazo de un mes.',
          ],
        },
        {
          heading: 'Qué se elimina',
          body: [
            'Se eliminan tu correo, nombre, hash de contraseña, identificador de Google y el vínculo con tu suscripción.',
          ],
        },
        {
          heading: 'Qué permanece',
          body: [
            'El contador anónimo de tu dispositivo (sin nombre ni correo) puede permanecer.',
            'Los justificantes de pago los conservan Stripe y PayPal durante los plazos legales; no tenemos control sobre ello.',
          ],
        },
      ],
    },
  },
  tr: {
    privacy: {
      title: 'Gizlilik politikası',
      updatedLabel: 'Son güncelleme',
      sections: [
        {
          heading: 'Veri sorumlusu',
          body: ['{owner}, ticari adı {trade}, {address}. İletişim: {email}.'],
        },
        {
          heading: 'Hangi verileri işliyoruz',
          body: [
            'Hesapsız kullanımda: rastgele bir cihaz kimliği ve ücretsiz hesaplamalarının sayacı.',
            'Hesaplayıcıya girdiklerin (örneğin brüt maaş) yalnızca sonucu hesaplamak için kullanılır ve saklanmaz.',
            'Hesapla: e-posta adresi, isteğe bağlı adın, şifren (yalnızca hash olarak, asla düz metin değil) ve Google ile girersen Google kimliği.',
            'Pro aboneliğinde: plan, durum ve süre ile Stripe veya PayPal müşteri ve abonelik kimlikleri. Kart veya PayPal giriş bilgilerini almıyoruz.',
            'Ziyaret sırasında teknik sunucu kayıtları oluşur (IP adresi, zaman, istenen sayfa).',
          ],
        },
        {
          heading: 'Amaçlar ve hukuki dayanaklar',
          body: [
            'Hesaplayıcıyı, hesabını ve aboneliğini sunmak (GDPR md. 6/1-b).',
            'Güvenlik, kötüye kullanımın önlenmesi ve ücretsiz hesaplamaların sınırlanması (meşru menfaat, GDPR md. 6/1-f).',
            'Ödemeler için yasal saklama yükümlülüklerini yerine getirmek (GDPR md. 6/1-c).',
            'Google giriş betiği web sitesiyle birlikte yüklenir; Google hesabındaki verileri yalnızca Google ile giriş yaparsan işleriz.',
          ],
        },
        {
          heading: 'Alıcılar ve hizmet sağlayıcılar',
          body: [
            'Barındırma: Render (Frankfurt veri merkezi, Almanya).',
            'Ödemeler: Stripe Payments Europe Ltd. (İrlanda) ve PayPal (Europe) S.à r.l. et Cie, S.C.A. (Lüksemburg).',
            'Giriş ve yazı tipi: Google (Google Sign-In, Google Fonts). Bu kaynaklar yüklenirken IP adresin Google’a iletilir.',
            'Alan adı ve DNS: DonDominio (İspanya).',
            'Bazı sağlayıcılar verileri üçüncü ülkelerde (örneğin ABD) işleyebilir; bu durumda standart sözleşme maddelerine dayanırız.',
          ],
        },
        {
          heading: 'Tarayıcıda ve uygulamada saklama',
          body: [
            'Yerel olarak yalnızca hizmetin ihtiyaç duyduğunu saklarız: cihaz kimliği, oturum belirteci ve dil ayarın. İzleme ve reklam yoktur.',
          ],
        },
        {
          heading: 'Saklama süresi',
          body: [
            'Hesap verileri, hesabını silene kadar saklanır. Stripe ve PayPal ödeme kayıtlarını yasal süreler boyunca tutar.',
            'Sunucu kayıtlarını barındırma sağlayıcısı yalnızca sınırlı bir süre saklar.',
          ],
        },
        {
          heading: 'Haklarınız',
          body: [
            'Erişim, düzeltme, silme, işlemenin kısıtlanması, veri taşınabilirliği ve itiraz haklarına sahipsin. Bize {email} adresinden yaz.',
            'Hesabını kendin de silebilirsin: “Hesabı sil” sayfasına bak.',
          ],
        },
        {
          heading: 'Şikâyet',
          body: ['Avusturya Veri Koruma Kurumu’na şikâyette bulunabilirsin: www.dsb.gv.at.'],
        },
        {
          heading: 'Değişiklikler',
          body: [
            'Hizmet değiştiğinde bu politikayı güncelleriz. Burada yayımlanan sürüm geçerlidir.',
          ],
        },
      ],
    },
    impressum: {
      title: 'Yasal bilgiler',
      updatedLabel: 'Son güncelleme',
      sections: [
        {
          heading: 'Hizmet sağlayıcı',
          body: ['{owner}, şahıs işletmesi, ticari adı {trade}', '{address}', 'E-posta: {email}'],
        },
        {
          heading: 'Faaliyet konusu',
          body: [
            'Yazılım geliştirme ve işletme; özellikle Avusturya için çevrimiçi net maaş hesaplayıcı ({domain}).',
          ],
        },
        {
          heading: 'Sorumluluk reddi',
          body: [
            'Hesaplamalar bağlayıcı değildir ve vergi veya hukuki danışmanlığın yerini tutmaz. Özenli kontrole rağmen doğruluk ve eksiksizlik garanti edilmez; vergi idaresinin kararları esastır.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Hesabı sil',
      updatedLabel: 'Son güncelleme',
      sections: [
        {
          heading: 'Uygulamada veya web sitesinde',
          body: [
            'Giriş yap, profilini aç ve “Hesabı sil”i seç. Soruyu onayla: hesabın hemen silinir.',
            'Etkin bir abonelik varsa iptal edilir.',
          ],
        },
        {
          heading: 'E-posta ile',
          body: [
            'Artık giriş yapamıyorsan, hesap e-postandan {email} adresine “Hesabı sil” konusuyla yaz. Hesabını bir ay içinde sileriz.',
          ],
        },
        {
          heading: 'Neler silinir',
          body: [
            'E-posta adresin, adın, şifre hash’in, Google kimliğin ve aboneliğinle bağlantı silinir.',
          ],
        },
        {
          heading: 'Neler kalır',
          body: [
            'Cihazının anonim sayacı (ad ve e-posta olmadan) kalabilir.',
            'Ödeme kayıtlarını Stripe ve PayPal yasal saklama süreleri boyunca tutar; bunun üzerinde etkimiz yoktur.',
          ],
        },
      ],
    },
  },
  bcs: {
    privacy: {
      title: 'Politika privatnosti',
      updatedLabel: 'Posljednje ažuriranje',
      sections: [
        {
          heading: 'Voditelj obrade',
          body: ['{owner}, trgovački naziv {trade}, {address}. Kontakt: {email}.'],
        },
        {
          heading: 'Koje podatke obrađujemo',
          body: [
            'Bez računa: nasumični identifikator uređaja i brojač tvojih besplatnih obračuna.',
            'Ono što uneseš u kalkulator (npr. bruto plaću) koristi se samo za izračun i ne pohranjuje se.',
            'S računom: adresa e-pošte, po želji tvoje ime, lozinka (samo kao hash, nikad kao običan tekst) i, ako se prijaviš preko Googlea, Google identifikator.',
            'S Pro pretplatom: paket, status i razdoblje te identifikatori kupca i pretplate iz Stripea ili PayPala. Ne primamo podatke o kartici ni pristupne podatke za PayPal.',
            'Pri posjeti nastaju tehnički zapisi poslužitelja (IP adresa, vrijeme, tražena stranica).',
          ],
        },
        {
          heading: 'Svrhe i pravne osnove',
          body: [
            'Pružanje kalkulatora, tvog računa i pretplate (čl. 6. st. 1. t. b GDPR).',
            'Sigurnost, sprječavanje zloupotrebe i ograničenje besplatnih obračuna (legitimni interes, čl. 6. st. 1. t. f GDPR).',
            'Ispunjavanje zakonskih obveza čuvanja podataka o plaćanjima (čl. 6. st. 1. t. c GDPR).',
            'Googleova skripta za prijavu učitava se s web stranicom; podatke s tvog Google računa obrađujemo samo ako se prijaviš preko Googlea.',
          ],
        },
        {
          heading: 'Primatelji i pružatelji usluga',
          body: [
            'Hosting: Render (podatkovni centar Frankfurt, Njemačka).',
            'Plaćanja: Stripe Payments Europe Ltd. (Irska) i PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luksemburg).',
            'Prijava i font: Google (Google Sign-In, Google Fonts). Pri učitavanju ovih resursa tvoja IP adresa šalje se Googleu.',
            'Domena i DNS: DonDominio (Španjolska).',
            'Neki pružatelji mogu obrađivati podatke u trećim zemljama (npr. SAD); tada se oslanjamo na standardne ugovorne klauzule.',
          ],
        },
        {
          heading: 'Pohrana u pregledniku i aplikaciji',
          body: [
            'Lokalno pohranjujemo samo ono što usluga treba: identifikator uređaja, token za prijavu i tvoju postavku jezika. Nema praćenja ni oglasa.',
          ],
        },
        {
          heading: 'Rok čuvanja',
          body: [
            'Podaci o računu čuvaju se do brisanja računa. Stripe i PayPal čuvaju potvrde o plaćanju u zakonskim rokovima.',
            'Zapise poslužitelja hosting pružatelj čuva samo ograničeno vrijeme.',
          ],
        },
        {
          heading: 'Tvoja prava',
          body: [
            'Imaš pravo na pristup, ispravak, brisanje, ograničenje obrade, prenosivost podataka i prigovor. Piši nam na {email}.',
            'Račun možeš i sam izbrisati: pogledaj stranicu „Izbriši račun“.',
          ],
        },
        {
          heading: 'Pritužba',
          body: ['Pritužbu možeš podnijeti austrijskom tijelu za zaštitu podataka: www.dsb.gv.at.'],
        },
        {
          heading: 'Izmjene',
          body: [
            'Ažuriramo ovu politiku kad se usluga promijeni. Vrijedi verzija objavljena ovdje.',
          ],
        },
      ],
    },
    impressum: {
      title: 'Pravne informacije',
      updatedLabel: 'Posljednje ažuriranje',
      sections: [
        {
          heading: 'Pružatelj usluge',
          body: [
            '{owner}, samostalni poduzetnik, trgovački naziv {trade}',
            '{address}',
            'E-pošta: {email}',
          ],
        },
        {
          heading: 'Predmet djelatnosti',
          body: [
            'Razvoj i rad softvera, posebno online kalkulatora neto plaće za Austriju ({domain}).',
          ],
        },
        {
          heading: 'Odricanje od odgovornosti',
          body: [
            'Izračuni nisu obvezujući i ne zamjenjuju porezno ni pravno savjetovanje. Unatoč pažljivoj provjeri ne jamčimo točnost ni potpunost; mjerodavna su rješenja porezne uprave.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Izbriši račun',
      updatedLabel: 'Posljednje ažuriranje',
      sections: [
        {
          heading: 'U aplikaciji ili na web stranici',
          body: [
            'Prijavi se, otvori profil i odaberi „Izbriši račun“. Potvrdi pitanje: račun se briše odmah.',
            'Aktivna pretplata pritom se otkazuje.',
          ],
        },
        {
          heading: 'E-poštom',
          body: [
            'Ako se više ne možeš prijaviti, piši s e-pošte svog računa na {email} s naslovom „Izbriši račun“. Račun brišemo u roku od mjesec dana.',
          ],
        },
        {
          heading: 'Što se briše',
          body: [
            'Brišu se tvoja e-pošta, ime, hash lozinke, Google identifikator i veza s pretplatom.',
          ],
        },
        {
          heading: 'Što ostaje',
          body: [
            'Anonimni brojač tvog uređaja (bez imena i e-pošte) može ostati.',
            'Potvrde o plaćanju čuvaju Stripe i PayPal u zakonskim rokovima; na to ne možemo utjecati.',
          ],
        },
      ],
    },
  },
  uk: {
    privacy: {
      title: 'Політика конфіденційності',
      updatedLabel: 'Останнє оновлення',
      sections: [
        {
          heading: 'Контролер даних',
          body: ['{owner}, торгова назва {trade}, {address}. Контакт: {email}.'],
        },
        {
          heading: 'Які дані ми обробляємо',
          body: [
            'Без акаунта: випадковий ідентифікатор пристрою та лічильник твоїх безкоштовних розрахунків.',
            'Те, що ти вводиш у калькулятор (наприклад, брутто-зарплату), використовується лише для обчислення й не зберігається.',
            'З акаунтом: адреса електронної пошти, за бажанням твоє ім’я, пароль (лише як хеш, ніколи відкритим текстом) і, якщо входиш через Google, ідентифікатор Google.',
            'З підпискою Pro: тариф, статус і період, а також ідентифікатори клієнта й підписки від Stripe або PayPal. Даних картки чи входу в PayPal ми не отримуємо.',
            'Під час відвідування створюються технічні журнали сервера (IP-адреса, час, запитана сторінка).',
          ],
        },
        {
          heading: 'Цілі та правові підстави',
          body: [
            'Надання калькулятора, твого акаунта й підписки (ст. 6(1)(b) GDPR).',
            'Безпека, запобігання зловживанням і обмеження безкоштовних розрахунків (законний інтерес, ст. 6(1)(f) GDPR).',
            'Виконання законних вимог щодо зберігання даних про платежі (ст. 6(1)(c) GDPR).',
            'Скрипт входу Google завантажується разом із сайтом; дані з твого акаунта Google ми обробляємо лише якщо ти входиш через Google.',
          ],
        },
        {
          heading: 'Одержувачі та постачальники послуг',
          body: [
            'Хостинг: Render (дата-центр Франкфурт, Німеччина).',
            'Платежі: Stripe Payments Europe Ltd. (Ірландія) та PayPal (Europe) S.à r.l. et Cie, S.C.A. (Люксембург).',
            'Вхід і шрифт: Google (Google Sign-In, Google Fonts). Під час завантаження цих ресурсів твоя IP-адреса передається Google.',
            'Домен і DNS: DonDominio (Іспанія).',
            'Деякі постачальники можуть обробляти дані в третіх країнах (наприклад, США); тоді ми спираємося на стандартні договірні положення.',
          ],
        },
        {
          heading: 'Зберігання в браузері та застосунку',
          body: [
            'Локально ми зберігаємо лише те, що потрібно сервісу: ідентифікатор пристрою, токен входу та твою мову. Немає відстеження й реклами.',
          ],
        },
        {
          heading: 'Строк зберігання',
          body: [
            'Дані акаунта зберігаються, доки ти його не видалиш. Stripe і PayPal зберігають платіжні документи впродовж законних строків.',
            'Журнали сервера хостинг-провайдер зберігає лише обмежений час.',
          ],
        },
        {
          heading: 'Твої права',
          body: [
            'Ти маєш право на доступ, виправлення, видалення, обмеження обробки, перенесення даних і заперечення. Пиши нам на {email}.',
            'Акаунт можна й видалити самостійно: див. сторінку «Видалити акаунт».',
          ],
        },
        {
          heading: 'Скарги',
          body: ['Ти можеш подати скаргу до австрійського органу із захисту даних: www.dsb.gv.at.'],
        },
        {
          heading: 'Зміни',
          body: ['Ми оновлюємо цю політику, коли змінюється сервіс. Діє версія, опублікована тут.'],
        },
      ],
    },
    impressum: {
      title: 'Правова інформація',
      updatedLabel: 'Останнє оновлення',
      sections: [
        {
          heading: 'Постачальник послуги',
          body: [
            '{owner}, індивідуальний підприємець, торгова назва {trade}',
            '{address}',
            'Ел. пошта: {email}',
          ],
        },
        {
          heading: 'Предмет діяльності',
          body: [
            'Розробка та експлуатація програмного забезпечення, зокрема онлайн-калькулятора нетто-зарплати для Австрії ({domain}).',
          ],
        },
        {
          heading: 'Відмова від відповідальності',
          body: [
            'Розрахунки не є обов’язковими й не замінюють податкову чи юридичну консультацію. Попри ретельну перевірку ми не гарантуємо точності та повноти; вирішальними є рішення податкової служби.',
          ],
        },
      ],
    },
    deleteAccount: {
      title: 'Видалити акаунт',
      updatedLabel: 'Останнє оновлення',
      sections: [
        {
          heading: 'У застосунку або на сайті',
          body: [
            'Увійди, відкрий свій профіль і вибери «Видалити акаунт». Підтверди запитання: акаунт буде видалено одразу.',
            'Активну підписку при цьому буде скасовано.',
          ],
        },
        {
          heading: 'Електронною поштою',
          body: [
            'Якщо ти більше не можеш увійти, напиши з ел. пошти акаунта на {email} з темою «Видалити акаунт». Ми видалимо акаунт протягом одного місяця.',
          ],
        },
        {
          heading: 'Що видаляється',
          body: [
            'Видаляються твоя ел. пошта, ім’я, хеш пароля, ідентифікатор Google і зв’язок із підпискою.',
          ],
        },
        {
          heading: 'Що залишається',
          body: [
            'Анонімний лічильник твого пристрою (без імені та ел. пошти) може залишитися.',
            'Платіжні документи зберігають Stripe і PayPal впродовж законних строків; ми не можемо на це впливати.',
          ],
        },
      ],
    },
  },
};
