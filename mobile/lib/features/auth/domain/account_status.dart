class AccountStatus {
  const AccountStatus({
    required this.id,
    required this.email,
    required this.name,
    required this.plan,
    required this.isPro,
    this.subscriptionProvider,
    this.subscriptionStatus,
    this.subscriptionCurrentPeriodEnd,
  });

  final String id;
  final String email;
  final String? name;
  final String plan;
  final bool isPro;
  final String? subscriptionProvider;
  final String? subscriptionStatus;
  final String? subscriptionCurrentPeriodEnd;

  factory AccountStatus.fromJson(Map<String, dynamic> json) => AccountStatus(
    id: json['id'] as String,
    email: json['email'] as String,
    name: json['name'] as String?,
    plan: json['plan'] as String,
    isPro: json['isPro'] as bool,
    subscriptionProvider: json['subscriptionProvider'] as String?,
    subscriptionStatus: json['subscriptionStatus'] as String?,
    subscriptionCurrentPeriodEnd:
        json['subscriptionCurrentPeriodEnd'] as String?,
  );
}
