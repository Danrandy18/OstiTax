import 'account_status.dart';

class AuthResponse {
  const AuthResponse({required this.accessToken, required this.account});

  final String accessToken;
  final AccountStatus account;

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    accessToken: json['accessToken'] as String,
    account: AccountStatus.fromJson(json['account'] as Map<String, dynamic>),
  );
}
