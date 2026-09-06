import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/billing_models.dart';

class BillingRepository {
  BillingRepository(this._client);

  final ApiClient _client;

  Future<StripeCheckoutResponse> createStripeCheckout(
    String authToken,
    String interval,
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/billing/stripe/checkout',
        data: {'interval': interval},
        options: _client.withAuth(authToken),
      );
      return StripeCheckoutResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }

  Future<PaypalSubscriptionResponse> createPaypalSubscription(
    String authToken,
    String interval,
  ) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/billing/paypal/subscription',
        data: {'interval': interval},
        options: _client.withAuth(authToken),
      );
      return PaypalSubscriptionResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromDioError(error);
    }
  }
}
