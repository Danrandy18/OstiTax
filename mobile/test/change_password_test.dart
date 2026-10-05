import 'package:app_calculos/core/l10n/app_strings.dart';
import 'package:app_calculos/core/network/api_client.dart';
import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/account/presentation/change_password_screen.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/domain/account_status.dart';
import 'package:app_calculos/features/auth/domain/auth_response.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _MemoryStorage implements FlutterSecureStorage {
  final values = <String, String>{};

  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) values[key] = value;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

AccountStatus _account({String locale = 'de'}) => AccountStatus(
  id: 'a-1',
  email: 'ana@example.com',
  name: null,
  plan: 'free',
  isPro: false,
  locale: locale,
);

class _FakeRepo implements AuthRepository {
  String? changeError;
  final calls = <String>[];

  @override
  Future<AuthResponse> changePassword(
    String token,
    String currentPassword,
    String newPassword,
  ) async {
    calls.add('change:$token:$currentPassword:$newPassword');
    final error = changeError;
    if (error != null) {
      throw ApiException(error == 'TOO_MANY' ? 429 : 400, 'x', code: error);
    }
    return AuthResponse(accessToken: 'token-2', account: _account());
  }

  @override
  Future<AccountStatus> updateLocale(String token, String locale) async {
    calls.add('locale:$locale');
    return _account(locale: locale);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class _SignedIn extends AuthController {
  _SignedIn(super.repo, super.storage, {super.localeOf}) {
    state = AuthState(account: _account(), token: 'token-1', ready: true);
  }
}

Future<(_FakeRepo, _MemoryStorage, ProviderContainer)> _pump(
  WidgetTester tester, {
  String locale = 'de',
}) async {
  final repo = _FakeRepo();
  final storage = _MemoryStorage();
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  final container = ProviderContainer(
    overrides: [
      localeProvider.overrideWith((ref) => locale),
      authControllerProvider.overrideWith((ref) => _SignedIn(repo, storage)),
    ],
  );
  addTearDown(container.dispose);
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(home: ChangePasswordScreen()),
    ),
  );
  await tester.pump();
  return (repo, storage, container);
}

String _de(String key) => AppStrings.t('de', key);

Future<void> _fill(
  WidgetTester tester, {
  String current = 'alt-passwort',
  String next = 'neues-passwort-1',
  String? confirm,
}) async {
  await tester.enterText(find.byKey(const Key('currentPassword')), current);
  await tester.enterText(find.byKey(const Key('newPassword')), next);
  await tester.enterText(
    find.byKey(const Key('confirmPassword')),
    confirm ?? next,
  );
  await tester.pump();
}

void main() {
  testWidgets('cambia la contraseña y guarda el token nuevo', (tester) async {
    final (repo, storage, container) = await _pump(tester);
    await _fill(tester);

    await tester.tap(find.byKey(const Key('changePasswordSubmit')));
    await tester.pumpAndSettle();

    expect(repo.calls, ['change:token-1:alt-passwort:neues-passwort-1']);
    expect(find.text(_de('profilePasswordChanged')), findsOneWidget);
    expect(container.read(authControllerProvider).token, 'token-2');
    expect(storage.values[authTokenStorageKey], 'token-2');
  });

  testWidgets('no envía nada si la confirmación no coincide', (tester) async {
    final (repo, _, _) = await _pump(tester);
    await _fill(tester, confirm: 'otra-cosa-123');

    await tester.tap(find.byKey(const Key('changePasswordSubmit')));
    await tester.pumpAndSettle();

    expect(repo.calls, isEmpty);
    expect(find.text(_de('profilePasswordMismatch')), findsOneWidget);
  });

  testWidgets('el botón espera a que la nueva tenga 8 caracteres', (
    tester,
  ) async {
    await _pump(tester);
    await _fill(tester, next: 'kurz');
    final button = tester.widget<ElevatedButton>(
      find.byKey(const Key('changePasswordSubmit')),
    );
    expect(button.onPressed, isNull);
  });

  for (final (code, key) in [
    ('WRONG_PASSWORD', 'profilePasswordWrong'),
    ('SAME_PASSWORD', 'profilePasswordSame'),
    ('TOO_MANY', 'profilePasswordTooMany'),
  ]) {
    testWidgets('muestra el error del backend $code', (tester) async {
      final (repo, _, _) = await _pump(tester);
      repo.changeError = code;
      await _fill(tester);

      await tester.tap(find.byKey(const Key('changePasswordSubmit')));
      await tester.pumpAndSettle();

      expect(find.text(_de(key)), findsOneWidget);
    });
  }

  for (final locale in AppStrings.supportedLocales) {
    testWidgets('cabe en 360 px y está traducida ("$locale")', (tester) async {
      await _pump(tester, locale: locale);
      expect(tester.takeException(), isNull);
      if (locale != 'de') {
        expect(
          AppStrings.t(locale, 'profileChangePasswordHint'),
          isNot(_de('profileChangePasswordHint')),
        );
      }
    });
  }

  test('al cambiar de idioma se avisa al backend para los correos', () async {
    final repo = _FakeRepo();
    var locale = 'de';
    final controller = _SignedIn(
      repo,
      _MemoryStorage(),
      localeOf: () => locale,
    );

    await controller.syncLocale('de');
    expect(repo.calls, isEmpty, reason: 'mismo idioma: no hace falta avisar');

    locale = 'tr';
    await controller.syncLocale('tr');
    expect(repo.calls, ['locale:tr']);
    expect(controller.state.account!.locale, 'tr');
  });
}
