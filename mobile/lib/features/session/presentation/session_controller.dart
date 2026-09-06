import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/providers.dart';
import '../data/session_repository.dart';
import '../domain/user_status.dart';

class SessionState {
  const SessionState({this.status, this.ready = false, this.error});

  final UserStatus? status;
  final bool ready;
  final String? error;

  SessionState copyWith({UserStatus? status, bool? ready, String? error}) =>
      SessionState(
        status: status ?? this.status,
        ready: ready ?? this.ready,
        error: error,
      );
}

class SessionController extends StateNotifier<SessionState> {
  SessionController(this._repository, this._prefs)
    : super(const SessionState()) {
    _bootstrap();
  }

  final SessionRepository _repository;
  final SharedPreferences _prefs;

  Future<void> _bootstrap() async {
    try {
      final stored = _prefs.getString(deviceIdStorageKey);
      final status = await _repository.createSession(stored);
      await _prefs.setString(deviceIdStorageKey, status.deviceId);
      state = SessionState(status: status, ready: true);
    } catch (_) {
      state = const SessionState(ready: true, error: 'session');
    }
  }

  void applyUsage({
    required String plan,
    required bool isPro,
    required int freeAttemptsRemaining,
  }) {
    final current = state.status;
    if (current == null) return;
    state = state.copyWith(
      status: current.copyWith(
        plan: plan,
        isPro: isPro,
        freeAttemptsRemaining: freeAttemptsRemaining,
      ),
    );
  }
}

final sessionControllerProvider =
    StateNotifierProvider<SessionController, SessionState>((ref) {
      return SessionController(
        ref.watch(sessionRepositoryProvider),
        ref.watch(sharedPreferencesProvider),
      );
    });
