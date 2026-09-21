import 'dart:typed_data';

import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/calculator/data/pdf_export.dart';
import 'package:app_calculos/features/calculator/domain/calculation_models.dart';
import 'package:app_calculos/features/calculator/presentation/calculator_controller.dart';
import 'package:app_calculos/features/calculator/presentation/pdf_export_button.dart';
import 'package:app_calculos/features/session/data/session_repository.dart';
import 'package:app_calculos/features/session/domain/user_status.dart';
import 'package:app_calculos/features/session/presentation/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _response = CalculateResponse(
  tableYear: 2026,
  recurring: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 549.6,
    incomeTax: 281.57,
    net: 2168.83,
  ),
  thirteenth: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 0,
    incomeTax: 120,
    net: 2880,
  ),
  fourteenth: PaymentBreakdown(
    gross: 3000,
    socialInsurance: 0,
    incomeTax: 120,
    net: 2880,
  ),
  annual: PaymentBreakdown(
    gross: 42000,
    socialInsurance: 6595.2,
    incomeTax: 3378.84,
    net: 32025.96,
  ),
);

class _FakeStorage implements FlutterSecureStorage {
  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

class _FakeAuthRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class _FakeSessionRepository implements SessionRepository {
  _FakeSessionRepository({required this.isPro});
  final bool isPro;

  @override
  Future<UserStatus> createSession(String? deviceId) async => UserStatus(
    deviceId: 'device-1',
    plan: isPro ? 'pro' : 'free',
    freeAttemptsRemaining: 3,
    isPro: isPro,
  );

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

/// Controlador de la calculadora que ya tiene un resultado (sin llamar al backend).
class _CalculatorWithResult extends CalculatorController {
  _CalculatorWithResult(super.ref) {
    state = const CalculatorState(result: _response);
  }
}

class _Shared {
  Uint8List? bytes;
  String? filename;
  int calls = 0;
}

Future<_Shared> _pump(
  WidgetTester tester, {
  required bool isPro,
  String locale = 'es',
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final shared = _Shared();

  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith((ref) => locale),
        authControllerProvider.overrideWith(
          (ref) => AuthController(_FakeAuthRepository(), _FakeStorage()),
        ),
        sessionControllerProvider.overrideWith(
          (ref) =>
              SessionController(_FakeSessionRepository(isPro: isPro), prefs),
        ),
        calculatorControllerProvider.overrideWith(
          (ref) => _CalculatorWithResult(ref),
        ),
        pdfSharerProvider.overrideWithValue((bytes, filename) async {
          shared
            ..bytes = bytes
            ..filename = filename
            ..calls += 1;
        }),
      ],
      child: const MaterialApp(
        home: Scaffold(body: Center(child: PdfExportButton())),
      ),
    ),
  );
  // La sesión se resuelve de forma asíncrona.
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pump(const Duration(milliseconds: 100));
  return shared;
}

void main() {
  testWidgets('Pro: genera un PDF válido y lo entrega para compartir', (
    tester,
  ) async {
    final shared = await _pump(tester, isPro: true);
    expect(find.byIcon(Icons.picture_as_pdf_rounded), findsOneWidget);

    // Generar el PDF carga las fuentes del bundle: E/S real, fuera del reloj falso del test.
    await tester.runAsync(() async {
      await tester.tap(find.text('Exportar PDF'));
      final deadline = DateTime.now().add(const Duration(seconds: 20));
      while (shared.calls == 0 && DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
    });
    await tester.pump();

    expect(shared.calls, 1);
    expect(String.fromCharCodes(shared.bytes!.take(5)), '%PDF-');
    expect(shared.filename, startsWith('OestiTax-Berechnung-'));
    expect(shared.filename, endsWith('.pdf'));
    expect(tester.takeException(), isNull);
  });

  testWidgets('sin Pro: avisa, no genera nada y no ofrece ningún pago', (
    tester,
  ) async {
    final shared = await _pump(tester, isPro: false);
    expect(find.byIcon(Icons.lock_outline_rounded), findsOneWidget);

    await tester.tap(find.text('Exportar PDF'));
    await tester.pumpAndSettle();

    expect(
      find.textContaining('La exportación PDF es una función Pro.'),
      findsOneWidget,
    );
    expect(find.textContaining('inicia sesión'), findsOneWidget);
    expect(find.textContaining('Stripe'), findsNothing);
    expect(find.textContaining('PayPal'), findsNothing);
    expect(shared.calls, 0);
    expect(tester.takeException(), isNull);
  });

  for (final locale in ['de', 'en', 'tr', 'bcs', 'es', 'uk']) {
    testWidgets('el botón cabe en 360 px ("$locale")', (tester) async {
      await _pump(tester, isPro: true, locale: locale);

      expect(find.byType(PdfExportButton), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}
