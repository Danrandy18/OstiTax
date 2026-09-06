import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../session/presentation/session_controller.dart';
import '../domain/calculation_models.dart';

enum ResultTab { recurring, thirteenth, fourteenth, annual }

class CalculatorState {
  const CalculatorState({
    this.form = const CalculateRequest(),
    this.result,
    this.activeTab = ResultTab.recurring,
    this.loading = false,
    this.error,
    this.paymentRequired = false,
  });

  final CalculateRequest form;
  final CalculateResponse? result;
  final ResultTab activeTab;
  final bool loading;
  final String? error;
  final bool paymentRequired;

  PaymentBreakdown? get activeBreakdown {
    final r = result;
    if (r == null) return null;
    switch (activeTab) {
      case ResultTab.recurring:
        return r.recurring;
      case ResultTab.thirteenth:
        return r.thirteenth;
      case ResultTab.fourteenth:
        return r.fourteenth;
      case ResultTab.annual:
        return r.annual;
    }
  }

  bool get showChildrenFields =>
      form.soleEarnerDeduction ||
      form.familyBonus != FamilyBonusType.none ||
      form.childrenUnder18 > 0 ||
      form.childrenOver18WithFamilyAllowance > 0;

  bool get commuteBlocked => form.benefitInKindFromCompanyCar;

  CalculatorState copyWith({
    CalculateRequest? form,
    Object? result = _unset,
    ResultTab? activeTab,
    bool? loading,
    Object? error = _unset,
    bool? paymentRequired,
  }) {
    return CalculatorState(
      form: form ?? this.form,
      result: identical(result, _unset)
          ? this.result
          : result as CalculateResponse?,
      activeTab: activeTab ?? this.activeTab,
      loading: loading ?? this.loading,
      error: identical(error, _unset) ? this.error : error as String?,
      paymentRequired: paymentRequired ?? this.paymentRequired,
    );
  }
}

const _unset = Object();

class CalculatorController extends StateNotifier<CalculatorState> {
  CalculatorController(this._ref) : super(const CalculatorState());

  final Ref _ref;

  void updateForm(CalculateRequest Function(CalculateRequest) updater) {
    state = state.copyWith(form: updater(state.form));
  }

  void setActiveTab(ResultTab tab) {
    state = state.copyWith(activeTab: tab);
  }

  void dismissPaymentRequired() {
    state = state.copyWith(paymentRequired: false);
  }

  Future<void> submit() async {
    if (state.loading) return;
    final deviceId = _ref.read(sessionControllerProvider).status?.deviceId;
    if (deviceId == null) return;
    final authToken = _ref.read(authControllerProvider).token;

    state = state.copyWith(loading: true, error: null, paymentRequired: false);
    try {
      final repo = _ref.read(calculatorRepositoryProvider);
      final response = await repo.calculate(
        state.form,
        deviceId: deviceId,
        authToken: authToken,
      );
      state = state.copyWith(
        result: response,
        activeTab: ResultTab.recurring,
        loading: false,
      );
      final usage = response.usage;
      if (usage != null) {
        _ref
            .read(sessionControllerProvider.notifier)
            .applyUsage(
              plan: usage.plan,
              isPro: usage.isPro,
              freeAttemptsRemaining: usage.freeAttemptsRemaining,
            );
      }
    } on ApiException catch (error) {
      if (error.isPaymentRequired) {
        _ref
            .read(sessionControllerProvider.notifier)
            .applyUsage(
              plan: 'free',
              isPro: false,
              freeAttemptsRemaining: error.freeAttemptsRemaining ?? 0,
            );
        state = state.copyWith(loading: false, paymentRequired: true);
      } else {
        state = state.copyWith(loading: false, error: 'errorGeneric');
      }
    } catch (_) {
      state = state.copyWith(loading: false, error: 'errorGeneric');
    }
  }
}

final calculatorControllerProvider =
    StateNotifierProvider<CalculatorController, CalculatorState>((ref) {
      return CalculatorController(ref);
    });
