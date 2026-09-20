import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/payment/presentation/upgrade_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

/// Sin sesión guardada y sin red: el controlador arranca "sin cuenta".
class _FakeStorage implements FlutterSecureStorage {
  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

class _FakeRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

Future<void> _openSheet(WidgetTester tester, {required String locale}) async {
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith((ref) => locale),
        authControllerProvider.overrideWith(
          (ref) => AuthController(_FakeRepository(), _FakeStorage()),
        ),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) => Center(
              child: ElevatedButton(
                onPressed: () => showUpgradeSheet(context),
                child: const Text('abrir'),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  await tester.tap(find.text('abrir'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('la comparativa Gratis vs Pro cabe en un móvil de 360 px', (
    tester,
  ) async {
    await _openSheet(tester, locale: 'es');

    expect(find.text('Gratis vs. Pro'), findsOneWidget);
    expect(find.text('3 cada 24 horas'), findsOneWidget);
    expect(find.text('Ilimitados'), findsOneWidget);
    expect(find.text('Próximamente'), findsOneWidget);
    expect(find.text('Elegir mi plan'), findsOneWidget);
    // Sin sesión iniciada aparece el acceso para quien ya tiene cuenta.
    expect(find.text('¿Ya tienes cuenta? Inicia sesión'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('cabe también en alemán, el idioma con los textos más largos', (
    tester,
  ) async {
    await _openSheet(tester, locale: 'de');

    expect(find.text('Gratis oder Pro'), findsOneWidget);
    expect(find.text('Tarif wählen'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  for (final locale in ['de', 'en', 'tr', 'bcs', 'es', 'uk']) {
    testWidgets('la comparativa cabe en 360 px con textos en "$locale"', (
      tester,
    ) async {
      await _openSheet(tester, locale: locale);

      expect(find.byType(UpgradeSheet), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}
