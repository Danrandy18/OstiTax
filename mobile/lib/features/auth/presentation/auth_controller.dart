import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart' show ApiException;
import '../../../core/providers.dart';
import '../data/auth_repository.dart';
import '../domain/account_status.dart';
import '../domain/auth_response.dart';

const authTokenStorageKey = 'authToken';

class AuthState {
  const AuthState({this.account, this.token, this.ready = false, this.error});

  final AccountStatus? account;
  final String? token;
  final bool ready;
  final String? error;

  bool get isAuthenticated => account != null;

  AuthState copyWith({
    AccountStatus? account,
    String? token,
    bool? ready,
    String? error,
  }) => AuthState(
    account: account ?? this.account,
    token: token ?? this.token,
    ready: ready ?? this.ready,
    error: error,
  );
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(
    this._repository,
    this._secureStorage, {
    String Function()? localeOf,
  }) : _localeOf = localeOf ?? (() => 'de'),
       super(const AuthState()) {
    _bootstrap();
  }

  final AuthRepository _repository;
  final FlutterSecureStorage _secureStorage;

  /// Idioma actual de la app: los correos (contraseña, Pro, facturas) salen en ese idioma.
  final String Function() _localeOf;

  Future<void> _bootstrap() async {
    final stored = await _secureStorage.read(key: authTokenStorageKey);
    if (stored == null) {
      state = state.copyWith(ready: true);
      return;
    }

    try {
      final account = await _repository.fetchMe(stored);
      state = AuthState(account: account, token: stored, ready: true);
      await syncLocale(_localeOf());
    } catch (_) {
      await _secureStorage.delete(key: authTokenStorageKey);
      state = const AuthState(ready: true);
    }
  }

  Future<bool> register(String email, String password, String? name) =>
      _handle(() => _repository.register(email, password, name, _localeOf()));

  Future<bool> login(String email, String password) =>
      _handle(() => _repository.login(email, password, _localeOf()));

  Future<bool> loginWithGoogle(String idToken) =>
      _handle(() => _repository.loginWithGoogle(idToken, _localeOf()));

  /// Al cambiar de idioma con la sesión iniciada se avisa al backend. No consume intentos.
  Future<void> syncLocale(String locale) async {
    final token = state.token;
    final account = state.account;
    if (token == null || account == null || account.locale == locale) return;
    try {
      final updated = await _repository.updateLocale(token, locale);
      if (state.token == token) state = state.copyWith(account: updated);
    } catch (_) {
      // Se reintenta en el próximo cambio o inicio; el idioma no es crítico.
    }
  }

  /// Devuelve null si se cambió, o el código de error del backend (WRONG_PASSWORD,
  /// SAME_PASSWORD, TOO_MANY_ATTEMPTS...). El token nuevo sustituye al anterior.
  Future<String?> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    final token = state.token;
    if (token == null) return 'errorGeneric';
    try {
      final response = await _repository.changePassword(
        token,
        currentPassword,
        newPassword,
      );
      await _secureStorage.write(
        key: authTokenStorageKey,
        value: response.accessToken,
      );
      state = AuthState(
        account: response.account,
        token: response.accessToken,
        ready: true,
      );
      return null;
    } on ApiException catch (error) {
      if (error.statusCode == 429) return 'TOO_MANY_ATTEMPTS';
      return error.code ?? 'errorGeneric';
    } catch (_) {
      return 'errorGeneric';
    }
  }

  /// Refresca el estado de la cuenta (ej. tras volver de un checkout de pago).
  Future<void> refreshAccount() async {
    final token = state.token;
    if (token == null) return;
    try {
      final account = await _repository.fetchMe(token);
      state = state.copyWith(account: account);
    } catch (_) {
      // El estado actual se conserva; el usuario puede reintentar.
    }
  }

  Future<void> logout() async {
    await _secureStorage.delete(key: authTokenStorageKey);
    state = const AuthState(ready: true);
  }

  Future<bool> deleteAccount() async {
    final token = state.token;
    if (token == null) return false;
    try {
      await _repository.deleteAccount(token);
      await logout();
      return true;
    } on ApiException {
      return false;
    }
  }

  Future<bool> _handle(Future<AuthResponse> Function() action) async {
    state = state.copyWith(error: null);
    try {
      final response = await action();
      await _secureStorage.write(
        key: authTokenStorageKey,
        value: response.accessToken,
      );
      state = AuthState(
        account: response.account,
        token: response.accessToken,
        ready: true,
      );
      return true;
    } on ApiException catch (error) {
      state = state.copyWith(ready: true, error: error.message);
      return false;
    } catch (_) {
      state = state.copyWith(ready: true, error: 'errorGeneric');
      return false;
    }
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) {
    final controller = AuthController(
      ref.watch(authRepositoryProvider),
      ref.watch(flutterSecureStorageProvider),
      localeOf: () => ref.read(localeProvider),
    );
    ref.listen<String>(
      localeProvider,
      (_, next) => controller.syncLocale(next),
    );
    return controller;
  },
);

/// Solo se ofrece "olvidé mi contraseña" si el servidor puede enviar el correo (Resend).
final passwordResetAvailableProvider = FutureProvider<bool>((ref) async {
  try {
    return await ref.watch(authRepositoryProvider).passwordResetByEmail();
  } catch (_) {
    return false;
  }
});
