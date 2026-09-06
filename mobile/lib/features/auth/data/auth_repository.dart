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
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {'email': email, 'password': password, 'name': ?name},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<AuthResponse> loginWithGoogle(String idToken) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/auth/google',
        data: {'idToken': idToken},
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
      await _client.dio.delete<void>('/auth/me', options: _client.withAuth(token));
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _client.dio.post<void>(
        '/auth/forgot-password',
        data: {'email': email},
      );
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
