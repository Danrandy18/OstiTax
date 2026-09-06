import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// Cliente HTTP compartido. El header X-Device-Id se inyecta por request
/// (no en un interceptor global) para evitar un ciclo de dependencias con
/// el provider de sesión.
class ApiClient {
  ApiClient()
    : dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 12),
        ),
      );

  final Dio dio;

  Options withDevice(String? deviceId) {
    return Options(
      headers: deviceId == null ? null : {'X-Device-Id': deviceId},
    );
  }

  Options withAuth(String? token) {
    return Options(
      headers: token == null ? null : {'Authorization': 'Bearer $token'},
    );
  }

  /// Combina ambos headers cuando un request necesita device + auth a la vez
  /// (ej. /calculate autenticado). Mismo motivo que withDevice/withAuth para
  /// no usar un interceptor global: evitar el ciclo con los providers de
  /// sesion/auth.
  Options merged(String? deviceId, String? token) {
    final headers = <String, String>{
      'X-Device-Id': ?deviceId,
      'Authorization': ?token != null ? 'Bearer $token' : null,
    };
    return Options(headers: headers.isEmpty ? null : headers);
  }
}

class ApiException implements Exception {
  ApiException(
    this.statusCode,
    this.message, {
    this.code,
    this.freeAttemptsRemaining,
  });

  final int? statusCode;
  final String message;
  final String? code;
  final int? freeAttemptsRemaining;

  bool get isPaymentRequired => statusCode == 402 || code == 'PAYMENT_REQUIRED';

  factory ApiException.fromDioError(DioException error) {
    final data = error.response?.data;
    final status = error.response?.statusCode;
    if (data is Map<String, dynamic>) {
      return ApiException(
        status,
        (data['message'] as String?) ?? error.message ?? 'Unknown error',
        code: data['code'] as String?,
        freeAttemptsRemaining: (data['freeAttemptsRemaining'] as num?)?.toInt(),
      );
    }
    return ApiException(status, error.message ?? 'Unknown error');
  }
}
