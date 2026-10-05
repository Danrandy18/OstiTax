import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/receipt_models.dart';

/// Mismos endpoints que la web: el backend extrae los datos, decide la regla GWG, guarda
/// los recibos en la cuenta y genera el PDF (siempre en aleman).
class ReceiptsRepository {
  ReceiptsRepository(this._client);

  final ApiClient _client;

  /// Envia solo el texto reconocido en el movil; la foto nunca sale del dispositivo.
  Future<ParsedReceipt> parse(String text, String token) => _call(() async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/receipts/parse',
      data: {'text': text},
      options: _client.withAuth(token),
    );
    return ParsedReceipt.fromJson(response.data!);
  });

  Future<List<Receipt>> list(String token) => _call(() async {
    final response = await _client.dio.get<List<dynamic>>(
      '/receipts',
      options: _client.withAuth(token),
    );
    return [
      for (final item in response.data ?? const [])
        Receipt.fromJson(item as Map<String, dynamic>),
    ];
  });

  Future<Receipt> create(ReceiptInput input, String token) => _call(() async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/receipts',
      data: input.toJson(),
      options: _client.withAuth(token),
    );
    return Receipt.fromJson(response.data!);
  });

  Future<void> remove(String id, String token) => _call(() async {
    await _client.dio.delete<void>(
      '/receipts/${Uri.encodeComponent(id)}',
      options: _client.withAuth(token),
    );
  });

  Future<void> removeAll(String token) => _call(() async {
    await _client.dio.delete<void>(
      '/receipts',
      options: _client.withAuth(token),
    );
  });

  /// PDF de la Arbeitnehmerveranlagung; [year] null exporta todos los anos.
  Future<Uint8List> exportPdf(int? year, String token) => _call(() async {
    final response = await _client.dio.get<List<int>>(
      '/receipts/export',
      queryParameters: {'format': 'pdf', 'year': ?year},
      options: _client
          .withAuth(token)
          .copyWith(
            responseType: ResponseType.bytes,
            receiveTimeout: const Duration(seconds: 30),
          ),
    );
    return Uint8List.fromList(response.data ?? const []);
  });

  Future<T> _call<T>(Future<T> Function() request) async {
    try {
      return await request();
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
