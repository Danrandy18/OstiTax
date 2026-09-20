class AppConfig {
  /// Produccion por defecto para que una build de release nunca apunte a localhost.
  /// En desarrollo: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api`
  /// (10.0.2.2 es el localhost de la PC visto desde el emulador de Android).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://ostitax-backend.onrender.com/api',
  );
}
