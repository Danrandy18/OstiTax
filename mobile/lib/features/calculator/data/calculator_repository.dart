import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/calculation_models.dart';

class CalculatorRepository {
  CalculatorRepository(this._client);

  final ApiClient _client;

  Future<CalculateResponse> calculate(
    CalculateRequest request, {
    required String? deviceId,
    String? authToken,
  }) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/calculate',
        data: request.toJson(),
        options: _client.merged(deviceId, authToken),
      );
      return CalculateResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
