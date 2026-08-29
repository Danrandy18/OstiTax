class UserStatus {
  const UserStatus({
    required this.deviceId,
    required this.plan,
    required this.freeAttemptsRemaining,
    required this.isPro,
    this.subscriptionProvider,
    this.subscriptionStatus,
  });

  final String deviceId;
  final String plan;
  final int freeAttemptsRemaining;
  final bool isPro;
  final String? subscriptionProvider;
  final String? subscriptionStatus;

  factory UserStatus.fromJson(Map<String, dynamic> json) => UserStatus(
    deviceId: json['deviceId'] as String,
    plan: json['plan'] as String,
    freeAttemptsRemaining: (json['freeAttemptsRemaining'] as num).toInt(),
    isPro: json['isPro'] as bool,
    subscriptionProvider: json['subscriptionProvider'] as String?,
    subscriptionStatus: json['subscriptionStatus'] as String?,
  );

  UserStatus copyWith({
    String? plan,
    int? freeAttemptsRemaining,
    bool? isPro,
  }) => UserStatus(
    deviceId: deviceId,
    plan: plan ?? this.plan,
    freeAttemptsRemaining: freeAttemptsRemaining ?? this.freeAttemptsRemaining,
    isPro: isPro ?? this.isPro,
    subscriptionProvider: subscriptionProvider,
    subscriptionStatus: subscriptionStatus,
  );
}
