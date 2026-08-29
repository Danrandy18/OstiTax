import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/user_status.dart';

class SessionRepository {
  SessionRepository(this._client);

  final ApiClient _client;

  Future<UserStatus> createSession(String? storedDeviceId) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/users/session',
        data: {if (storedDeviceId != null) 'deviceId': storedDeviceId},
      );
      return UserStatus.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<UserStatus> refreshStatus(String deviceId) async {
    try {
      final response = await _client.dio.get<Map<String, dynamic>>(
        '/billing/status',
        options: _client.withDevice(deviceId),
      );
      return UserStatus.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
