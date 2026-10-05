import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/account_status.dart';
import '../domain/auth_response.dart';

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<AuthResponse> register(
    String email,
    String password,
    String? name,
    String locale,
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'name': ?name,
          'locale': locale,
        },
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<AuthResponse> login(
    String email,
    String password,
    String locale,
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password, 'locale': locale},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<AuthResponse> loginWithGoogle(String idToken, String locale) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/google',
        data: {'idToken': idToken, 'locale': locale},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<AccountStatus> fetchMe(String token) async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/auth/me',
        options: _client.withAuth(token),
      );
      return AccountStatus.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<void> deleteAccount(String token) async {
    try {
      await _client.dio.delete<void>(
        '/auth/me',
        options: _client.withAuth(token),
      );
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  /// El correo sale en [locale], el idioma que tiene la app en ese momento.
  Future<void> forgotPassword(String email, String locale) async {
    try {
      await _client.dio.post<void>(
        '/auth/forgot-password',
        data: {'email': email, 'locale': locale},
      );
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  /// Cambia la contraseña con la sesión iniciada. El backend cierra las demás sesiones y
  /// devuelve un token nuevo para este dispositivo.
  Future<AuthResponse> changePassword(
    String token,
    String currentPassword,
    String newPassword,
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/change-password',
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
        options: _client.withAuth(token),
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  /// Avisa al backend del idioma actual: los correos siguientes salen en ese idioma.
  Future<AccountStatus> updateLocale(String token, String locale) async {
    try {
      final response = await _client.dio.patch<Map<String, dynamic>>(
        '/auth/me',
        data: {'locale': locale},
        options: _client.withAuth(token),
      );
      return AccountStatus.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  /// Lo que la app debe mostrar según la configuración del servidor.
  Future<bool> passwordResetByEmail() async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/auth/config',
      );
      return response.data?['passwordResetByEmail'] as bool? ?? false;
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<void> resetPassword(String token, String password) async {
    try {
      await _client.dio.post<void>(
        '/auth/reset-password',
        data: {'token': token, 'password': password},
      );
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
