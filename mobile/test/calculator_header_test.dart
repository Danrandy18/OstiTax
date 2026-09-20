import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/domain/account_status.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/calculator/presentation/calculator_screen.dart';
import 'package:app_calculos/features/session/data/session_repository.dart';
import 'package:app_calculos/features/session/domain/user_status.dart';
import 'package:app_calculos/features/session/presentation/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

class _LoggedInAuth extends AuthController {
  _LoggedInAuth() : super(_FakeAuthRepository(), _FakeStorage()) {
    state = const AuthState(
      ready: true,
      account: AccountStatus(
        id: 'a-1',
        email: 'usuario.con.correo.largo@ejemplo.com',
        name: null,
        plan: 'free',
        isPro: false,
      ),
    );
  }
}

Future<void> _pumpHeader(
  WidgetTester tester, {
  required bool loggedIn,
  required bool isPro,
  String locale = 'de',
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();

  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith((ref) => locale),
        authControllerProvider.overrideWith(
          (ref) => loggedIn
              ? _LoggedInAuth()
              : AuthController(_FakeAuthRepository(), _FakeStorage()),
        ),
        sessionControllerProvider.overrideWith(
          (ref) =>
              SessionController(_FakeSessionRepository(isPro: isPro), prefs),
        ),
      ],
      child: const MaterialApp(home: CalculatorScreen()),
    ),
  );
  // El logo animado no se "asienta": se avanza el tiempo a mano.
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 400));
  }
}

void main() {
  testWidgets('sin sesión: aparece Mejorar a Pro y no hay icono de login', (
    tester,
  ) async {
    await _pumpHeader(tester, loggedIn: false, isPro: false);

    expect(find.byTooltip('Auf Pro upgraden'), findsOneWidget);
    expect(find.byIcon(Icons.login_rounded), findsNothing);
    // El contador de intentos sigue a la vista (ahora junto al subtitulo).
    expect(find.textContaining(': 3'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('con sesión y sin Pro (caso más apretado) cabe en 360 px', (
    tester,
  ) async {
    await _pumpHeader(tester, loggedIn: true, isPro: false);

    expect(find.byTooltip('Auf Pro upgraden'), findsOneWidget);
    expect(find.byIcon(Icons.person_outline_rounded), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('con Pro no se ofrece mejorar', (tester) async {
    await _pumpHeader(tester, loggedIn: false, isPro: true);

    expect(find.byTooltip('Auf Pro upgraden'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  for (final locale in ['de', 'en', 'tr', 'bcs', 'es', 'uk']) {
    testWidgets('encabezado con sesión y sin Pro cabe en 360 px ("$locale")', (
      tester,
    ) async {
      await _pumpHeader(tester, loggedIn: true, isPro: false, locale: locale);

      expect(tester.takeException(), isNull);
    });
  }
}
