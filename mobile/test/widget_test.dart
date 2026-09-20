import 'package:flutter_test/flutter_test.dart';

import 'package:app_calculos/core/l10n/app_strings.dart';

void main() {
  group('AppStrings', () {
    test('falls back to German when a key is missing in a locale', () {
      expect(AppStrings.t('en', 'appTitle'), 'ÖstiTax');
      expect(AppStrings.t('unknown-locale', 'calculate'), 'Jetzt berechnen');
    });

    test('every supported locale has the core calculator keys', () {
      const requiredKeys = [
        'iAm',
        'calculate',
        'results',
        'net',
        'payWithStripe',
        'payWithPaypal',
      ];
      for (final locale in AppStrings.supportedLocales) {
        for (final key in requiredKeys) {
          expect(
            AppStrings.t(locale, key),
            isNot(key),
            reason: 'Missing "$key" for locale "$locale"',
          );
        }
      }
    });

    test('the Free vs Pro comparison is translated in every language', () {
      const compareKeys = [
        'upgradeCta',
        'compareTitle',
        'compareSubtitle',
        'compareFeatureCol',
        'compareFreeCol',
        'compareProCol',
        'compareRowCalcs',
        'compareCalcsFree',
        'compareCalcsPro',
        'compareRowPdf',
        'compareRowAccount',
        'compareRowOcr',
        'compareComingSoon',
        'comparePriceLine',
        'compareChoosePlan',
        'compareHaveAccount',
      ];
      // 'Pro' y el nombre de la columna gratis pueden coincidir con el alemán; el resto no.
      const mayMatchGerman = {'compareProCol', 'compareFreeCol'};
      for (final locale in AppStrings.supportedLocales) {
        for (final key in compareKeys) {
          final value = AppStrings.t(locale, key);
          expect(value, isNot(key), reason: 'Missing "$key" for "$locale"');
          if (locale != 'de' && !mayMatchGerman.contains(key)) {
            expect(
              value,
              isNot(AppStrings.t('de', key)),
              reason: '"$key" for "$locale" is just the German fallback',
            );
          }
        }
      }
    });
  });
}
