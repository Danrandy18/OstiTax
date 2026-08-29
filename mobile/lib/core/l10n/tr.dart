import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';
import 'app_strings.dart';

/// Azúcar sintáctica: `ref.tr('calculate')`.
extension TranslateRef on WidgetRef {
  /// Usa watch: el widget se reconstruye cuando cambia el idioma.
  String tr(String key) => AppStrings.t(watch(localeProvider), key);
}
