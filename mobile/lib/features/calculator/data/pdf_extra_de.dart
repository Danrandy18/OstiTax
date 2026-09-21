/// Textos extra del PDF (versión básica y completa), siempre en alemán oficial.
/// Espejo del bloque DE de web/src/app/core/pdf/pdf-extra.ts: mantener ambos alineados.
abstract final class PdfExtraDe {
  static const pageWord = 'Seite';
  static const basicSummary = 'Zusammenfassung';
  static const basicNetLabel = 'Nettobezug (laufend)';
  static const basicAnnualNet = 'Nettobezug (Jahresbezug)';
  static const basicInputs = 'Grunddaten';
  static const basicOverview = 'Überblick';
  static const upgradeTitle = 'Auf Pro upgraden';
  static const upgradeBody =
      'Für die vollständige Aufschlüsselung, ausführliche Erklärungen und den Leitfaden zur Einreichung.';
  static const appliedTitle = 'Berücksichtigte Angaben';
  static const appliedNone =
      'Keine besonderen Absetzbeträge oder Freibeträge angegeben.';
  static const explainTitle = 'Erläuterungen zu den Positionen';
  static const tipsTitle = 'Hinweise zur Optimierung';
  static const tipsIntro =
      'Allgemeine Hinweise auf Basis Ihrer Angaben. Bitte prüfen Sie selbst, ob sie auf Sie zutreffen.';
  static const guideTitle =
      'Leitfaden zur Einreichung (Arbeitnehmerveranlagung)';
  static const guideNote =
      'Angaben ohne Gewähr; Bezeichnungen der Formulare können sich ändern. Maßgeblich sind die offiziellen Formulare und Hinweise des BMF (bmf.gv.at). Dieses Dokument ist weder eine Steuererklärung noch ersetzt es eine Steuerberatung.';
  static const appliedSoleEarner =
      'Alleinverdiener-/Alleinerzieherabsetzbetrag berücksichtigt';
  static const appliedFamilyBonusFull = 'Familienbonus Plus: voller Bonus';
  static const appliedFamilyBonusShared = 'Familienbonus Plus: geteilter Bonus';
  static const appliedChildren =
      'Kinder unter 18: {u18}, über 18 mit Familienbeihilfe: {o18}';
  static const appliedCommute = 'Pendlerpauschale: {km} km einfache Wegstrecke';
  static const appliedAllowance = 'Monatlicher Freibetrag: {amount}';
  static const appliedBenefitInKind = 'Sachbezug (monatlich): {amount}';
  static const appliedCompanyCar = 'Firmenauto (Sachbezug KFZ) berücksichtigt';
  static const tipFamilyBonus =
      'Sie haben Kinder angegeben, aber keinen Familienbonus Plus gewählt. Prüfen Sie, ob Sie ihn (voll oder geteilt) beanspruchen können.';
  static const tipSoleEarner =
      'Sie haben Kinder angegeben. Prüfen Sie, ob der Alleinverdiener- oder Alleinerzieherabsetzbetrag für Sie in Frage kommt.';
  static const tipCommute =
      'Sie haben keine Pendelstrecke angegeben. Wenn Sie zur Arbeit pendeln, kann die Pendlerpauschale die Steuer senken; der Pendlerrechner des BMF hilft bei der Prüfung.';
  static const tipAllowance =
      'Ein Freibetragsbescheid (z. B. für Werbungskosten oder Sonderausgaben) kann die laufende Lohnsteuer schon während des Jahres senken.';
  static const tipReceipts =
      'Sammeln Sie Belege für Werbungskosten wie Arbeitsmittel, Fortbildung oder Reisekosten: Sie können in der Arbeitnehmerveranlagung geltend gemacht werden.';
  static const tipVeranlagung =
      'Die Arbeitnehmerveranlagung kann rückwirkend für bis zu fünf Jahre beantragt werden.';
  static const explain = <(String, String)>[
    (
      'Bruttobezug',
      'Der Bruttobezug ist Ihr Arbeitsentgelt vor Abzügen. Das Ergebnis geht von 14 gleich hohen Bezügen aus: zwölf laufende Monatsbezüge sowie das 13. und 14. Gehalt (Urlaubs- und Weihnachtsgeld).',
    ),
    (
      'Sozialversicherung',
      'Die Sozialversicherung umfasst unter anderem Kranken-, Pensions- und Arbeitslosenversicherung. Sie wird bis zur jeweiligen Höchstbeitragsgrundlage berechnet und mindert die Bemessungsgrundlage der Lohnsteuer.',
    ),
    (
      'Lohnsteuer',
      'Die Lohnsteuer wird nach dem progressiven Einkommensteuertarif berechnet. Absetzbeträge verringern die errechnete Steuer direkt, Freibeträge verringern die Bemessungsgrundlage.',
    ),
    (
      '13. und 14. Gehalt',
      'Das 13. und 14. Gehalt sind sonstige Bezüge und werden im Rahmen des Jahressechstels begünstigt besteuert. Die Sozialversicherung fällt weiterhin an.',
    ),
    (
      'Familienbonus Plus',
      'Der Familienbonus Plus ist ein Absetzbetrag pro Kind und verringert die Lohnsteuer direkt. Er kann von einer Person voll oder von zwei Personen geteilt beansprucht werden.',
    ),
    (
      'Pendlerpauschale',
      'Die Pendlerpauschale berücksichtigt den Arbeitsweg. Ob das kleine oder das große Pendlerpauschale gilt, hängt von Entfernung und Zumutbarkeit der öffentlichen Verkehrsmittel ab. Der Pendlereuro kommt als Absetzbetrag hinzu.',
    ),
  ];
  static const guide = <String>[
    'Zugang zu FinanzOnline einrichten (z. B. mit ID Austria).',
    'Unter „Formulare“ die Erklärung zur Arbeitnehmerveranlagung (Formular L1) öffnen.',
    'Kinder und Familienbonus Plus über die Beilage L1k angeben, Alleinverdiener-/Alleinerzieherabsetzbetrag über die Beilage L1ab.',
    'Werbungskosten, Sonderausgaben und außergewöhnliche Belastungen samt Belegen erfassen; die Pendlerpauschale mit dem Pendlerrechner des BMF prüfen.',
    'Erklärung absenden, den Bescheid abwarten und die Belege aufbewahren.',
  ];
}
