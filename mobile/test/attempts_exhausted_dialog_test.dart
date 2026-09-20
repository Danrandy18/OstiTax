import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/calculator/presentation/attempts_exhausted_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeStorage implements FlutterSecureStorage {
  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

class _FakeRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

Future<void> _open(WidgetTester tester, String locale) async {
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
            builder: (context) => TextButton(
              onPressed: () => showAttemptsExhaustedDialog(context),
              child: const Text('abrir'),
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
  testWidgets('informa de que los intentos vuelven y no lleva a ningún pago', (
    tester,
  ) async {
    await _open(tester, 'es');

    expect(find.text('Cálculos gratis agotados'), findsOneWidget);
    expect(find.textContaining('24 horas'), findsOneWidget);
    // Deja entrar a quien ya tiene Pro, pero no ofrece comprar nada.
    expect(find.text('Iniciar sesión'), findsOneWidget);
    expect(find.textContaining('Pro'), findsOneWidget);
    expect(find.textContaining('Stripe'), findsNothing);
    expect(find.textContaining('PayPal'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  for (final locale in ['de', 'en', 'tr', 'bcs', 'es', 'uk']) {
    testWidgets('el aviso cabe en 360 px ("$locale")', (tester) async {
      await _open(tester, locale);

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}
