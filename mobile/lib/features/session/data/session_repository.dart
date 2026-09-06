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
        data: {'deviceId': ?storedDeviceId},
      );
      return UserStatus.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
