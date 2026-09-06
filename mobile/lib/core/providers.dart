import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'network/api_client.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/calculator/data/calculator_repository.dart';
import '../features/payment/data/billing_repository.dart';
import '../features/session/data/session_repository.dart';

/// Se sobreescribe en main() una vez que SharedPreferences.getInstance() resuelve.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError(
    'sharedPreferencesProvider debe ser sobreescrito en main()',
  ),
);

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final sessionRepositoryProvider = Provider<SessionRepository>(
  (ref) => SessionRepository(ref.watch(apiClientProvider)),
);

final calculatorRepositoryProvider = Provider<CalculatorRepository>(
  (ref) => CalculatorRepository(ref.watch(apiClientProvider)),
);

final billingRepositoryProvider = Provider<BillingRepository>(
  (ref) => BillingRepository(ref.watch(apiClientProvider)),
);

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);

const localeStorageKey = 'app_lang';
const onboardingSeenKey = 'onboarding_seen_v1';
const deviceIdStorageKey = 'deviceId';

final localeProvider = StateProvider<String>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  final stored = prefs.getString(localeStorageKey);
  return stored ?? 'de';
});
