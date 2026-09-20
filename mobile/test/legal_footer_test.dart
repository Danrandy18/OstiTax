import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/core/widgets/legal_disclaimer_footer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _pump(WidgetTester tester, String locale) async {
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [localeProvider.overrideWith((ref) => locale)],
      child: const MaterialApp(
        home: Scaffold(bottomNavigationBar: LegalDisclaimerFooter()),
      ),
    ),
  );
}

/// Texto plano del RichText del aviso (título + cuerpo).
String _footerText(WidgetTester tester) {
  final rich = tester.widget<RichText>(find.byType(RichText).last);
  return rich.text.toPlainText();
}

void main() {
  // El aviso debe seguir el idioma de la UI, como en la web (antes salía siempre en alemán).
  const expected = {
    'de': 'Haftungsausschluss: Keine Steuerberatung.',
    'en': 'Disclaimer: Not tax advice.',
    'es': 'Aviso legal: No es asesoría fiscal.',
    'tr': 'Sorumluluk reddi: Vergi danışmanlığı değildir.',
    'bcs': 'Odricanje od odgovornosti: Nije poresko savjetovanje.',
    'uk': 'Застереження: Це не податкова консультація.',
  };

  for (final entry in expected.entries) {
    testWidgets('el aviso legal sale en "${entry.key}" y cabe en 360 px', (
      tester,
    ) async {
      await _pump(tester, entry.key);

      expect(_footerText(tester), startsWith(entry.value));
      expect(tester.takeException(), isNull);
    });
  }
}
