import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/providers.dart';
import '../../auth/presentation/auth_controller.dart';
import '../data/receipts_repository.dart';
import '../domain/receipt_models.dart';

final receiptsRepositoryProvider = Provider<ReceiptsRepository>(
  (ref) => ReceiptsRepository(ref.watch(apiClientProvider)),
);

class ReceiptsState {
  const ReceiptsState({
    this.receipts = const [],
    this.loading = false,
    this.loaded = false,
    this.loadFailed = false,
  });

  final List<Receipt> receipts;
  final bool loading;
  final bool loaded;
  final bool loadFailed;

  ReceiptsState copyWith({
    List<Receipt>? receipts,
    bool? loading,
    bool? loaded,
    bool? loadFailed,
  }) => ReceiptsState(
    receipts: receipts ?? this.receipts,
    loading: loading ?? this.loading,
    loaded: loaded ?? this.loaded,
    loadFailed: loadFailed ?? this.loadFailed,
  );
}

/// Recibos guardados en la cuenta (los mismos que ve la web).
class ReceiptsController extends StateNotifier<ReceiptsState> {
  ReceiptsController(this._repository, this._token)
    : super(const ReceiptsState());

  final ReceiptsRepository _repository;
  final String? _token;

  String get _requireToken {
    final token = _token;
    if (token == null) throw StateError('Not signed in');
    return token;
  }

  Future<void> load() async {
    if (_token == null) return;
    state = state.copyWith(loading: true, loadFailed: false);
    try {
      final receipts = await _repository.list(_requireToken);
      state = ReceiptsState(receipts: receipts, loaded: true);
    } catch (_) {
      state = state.copyWith(loading: false, loadFailed: true);
    }
  }

  Future<void> add(ReceiptInput input) async {
    final saved = await _repository.create(input, _requireToken);
    final list = [saved, ...state.receipts]
      ..sort((a, b) => (b.date ?? '').compareTo(a.date ?? ''));
    state = state.copyWith(receipts: list);
  }

  Future<void> remove(String id) async {
    await _repository.remove(id, _requireToken);
    state = state.copyWith(
      receipts: state.receipts.where((r) => r.id != id).toList(),
    );
  }

  Future<void> removeAll() async {
    await _repository.removeAll(_requireToken);
    state = state.copyWith(receipts: const []);
  }
}

final receiptsControllerProvider =
    StateNotifierProvider.autoDispose<ReceiptsController, ReceiptsState>((ref) {
      final token = ref.watch(authControllerProvider.select((s) => s.token));
      return ReceiptsController(ref.watch(receiptsRepositoryProvider), token)
        ..load();
    });
