class StripeCheckoutResponse {
  const StripeCheckoutResponse({required this.url, required this.sessionId});

  final String url;
  final String sessionId;

  factory StripeCheckoutResponse.fromJson(Map<String, dynamic> json) =>
      StripeCheckoutResponse(
        url: json['url'] as String,
        sessionId: json['sessionId'] as String,
      );
}

class PaypalSubscriptionResponse {
  const PaypalSubscriptionResponse({
    required this.approvalUrl,
    required this.subscriptionId,
  });

  final String approvalUrl;
  final String subscriptionId;

  factory PaypalSubscriptionResponse.fromJson(Map<String, dynamic> json) =>
      PaypalSubscriptionResponse(
        approvalUrl: json['approvalUrl'] as String,
        subscriptionId: json['subscriptionId'] as String,
      );
}
