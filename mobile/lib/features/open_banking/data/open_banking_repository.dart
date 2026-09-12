import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/bank_models.dart';

class OpenBankingRepository {
  OpenBankingRepository(this._client);

  final ApiClient _client;

  Future<List<BankInstitution>> listInstitutions(String authToken) async {
    try {
      final response = await _client.dio.get<List<dynamic>>(
        '/open-banking/institutions',
        options: _client.withAuth(authToken),
      );
      return response.data!
          .map((e) => BankInstitution.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<String> startLink(String authToken, String institutionId) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/open-banking/link',
        data: {'institutionId': institutionId},
        options: _client.withAuth(authToken),
      );
      return response.data!['redirectUrl'] as String;
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<void> syncTransactions(String authToken, String connectionId) async {
    try {
      await _client.dio.post<Map<String, dynamic>>(
        '/open-banking/connections/$connectionId/sync',
        options: _client.withAuth(authToken),
      );
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<List<BankConnection>> listConnections(String authToken) async {
    try {
      final response = await _client.dio.get<List<dynamic>>(
        '/open-banking/connections',
        options: _client.withAuth(authToken),
      );
      return response.data!
          .map((e) => BankConnection.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<List<BankTransaction>> listTransactions(String authToken) async {
    try {
      final response = await _client.dio.get<List<dynamic>>(
        '/open-banking/transactions',
        options: _client.withAuth(authToken),
      );
      return response.data!
          .map((e) => BankTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
