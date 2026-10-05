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
    this.subscriptionCancelAtPeriodEnd = false,
    this.hasPassword = true,
    this.locale = 'de',
  });

  final String id;
  final String email;
  final String? name;
  final String plan;
  final bool isPro;
  final String? subscriptionProvider;
  final String? subscriptionStatus;
  final String? subscriptionCurrentPeriodEnd;

  /// Cancelada: Pro sigue hasta subscriptionCurrentPeriodEnd y no se renueva.
  final bool subscriptionCancelAtPeriodEnd;

  /// false en cuentas solo de Google: no hay contraseña que cambiar.
  final bool hasPassword;

  /// Idioma en el que el backend envía los correos.
  final String locale;

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
    subscriptionCancelAtPeriodEnd:
        json['subscriptionCancelAtPeriodEnd'] as bool? ?? false,
    hasPassword: json['hasPassword'] as bool? ?? true,
    locale: json['locale'] as String? ?? 'de',
  );
}
