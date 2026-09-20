import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/tr.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/animated_logo.dart';
import '../../../core/widgets/legal_disclaimer_footer.dart';
import '../../../core/widgets/segmented_toggle.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../payment/presentation/payment_sheet.dart';
import '../../payment/presentation/upgrade_sheet.dart';
import '../../session/presentation/session_controller.dart';
import '../domain/calculation_models.dart';
import 'calculator_controller.dart';
import 'result_card.dart';

class CalculatorScreen extends ConsumerStatefulWidget {
  const CalculatorScreen({super.key});

  @override
  ConsumerState<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends ConsumerState<CalculatorScreen> {
  late final TextEditingController _grossCtrl;
  late final TextEditingController _benefitInKindCtrl;
  late final TextEditingController _taxFreeCtrl;
  late final TextEditingController _commuteKmCtrl;
  late final TextEditingController _childrenUnder18Ctrl;
  late final TextEditingController _childrenOver18Ctrl;
  late final TextEditingController _carCostCtrl;
  late final TextEditingController _carCo2Ctrl;
  late final TextEditingController _carYearCtrl;

  bool _paymentSheetQueued = false;

  @override
  void initState() {
    super.initState();
    final form = ref.read(calculatorControllerProvider).form;
    _grossCtrl = TextEditingController(text: _fmt(form.grossAmount));
    _benefitInKindCtrl = TextEditingController(
      text: _fmt(form.benefitInKindMonthly),
    );
    _taxFreeCtrl = TextEditingController(
      text: _fmt(form.taxFreeAllowanceMonthly),
    );
    _commuteKmCtrl = TextEditingController(text: _fmt(form.commuteOneWayKm));
    _childrenUnder18Ctrl = TextEditingController(
      text: '${form.childrenUnder18}',
    );
    _childrenOver18Ctrl = TextEditingController(
      text: '${form.childrenOver18WithFamilyAllowance}',
    );
    _carCostCtrl = TextEditingController();
    _carCo2Ctrl = TextEditingController();
    _carYearCtrl = TextEditingController(text: '${DateTime.now().year}');
  }

  String _fmt(double v) =>
      v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toString();

  @override
  void dispose() {
    for (final c in [
      _grossCtrl,
      _benefitInKindCtrl,
      _taxFreeCtrl,
      _commuteKmCtrl,
      _childrenUnder18Ctrl,
      _childrenOver18Ctrl,
      _carCostCtrl,
      _carCo2Ctrl,
      _carYearCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _update(CalculateRequest Function(CalculateRequest) fn) =>
      ref.read(calculatorControllerProvider.notifier).updateForm(fn);

  @override
  Widget build(BuildContext context) {
    final calcState = ref.watch(calculatorControllerProvider);
    final session = ref.watch(sessionControllerProvider);
    final auth = ref.watch(authControllerProvider);
    final form = calcState.form;
    final isPro =
        (auth.account?.isPro ?? false) || (session.status?.isPro ?? false);

    ref.listen<CalculatorState>(calculatorControllerProvider, (previous, next) {
      if (next.paymentRequired && !_paymentSheetQueued) {
        _paymentSheetQueued = true;
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          ref
              .read(calculatorControllerProvider.notifier)
              .dismissPaymentRequired();
          await showPaymentSheet(context);
          _paymentSheetQueued = false;
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: Row(
          children: [
            const SizedBox(
              width: 34,
              height: 34,
              child: AnimatedLogo(size: 34),
            ),
            const SizedBox(width: 10),
            const Text(
              'ÖstiTax',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
            ),
          ],
        ),
        actions: [
          // El contador de intentos va junto al subtitulo, en el cuerpo: junto al boton Pro, la
          // cuenta y el idioma no cabe en 360 px.
          if (session.status != null && isPro) const _StatusBadge(isPro: true),
          if (!isPro)
            _UpgradeButton(
              // Con sesión iniciada además hay icono de cuenta: en pantallas estrechas el botón
              // pasa a ser solo el icono para que el encabezado no se desborde.
              compact:
                  auth.account != null &&
                  MediaQuery.sizeOf(context).width < 420,
              onPressed: () => showUpgradeSheet(context),
            ),
          if (auth.account != null)
            IconButton(
              icon: const Icon(Icons.person_outline_rounded),
              tooltip: auth.account!.email,
              visualDensity: VisualDensity.compact,
              onPressed: () => context.push('/account'),
            ),
          const SizedBox(width: 6),
          _LanguageMenu(),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ref.tr('appSubtitle'),
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (session.status != null && !isPro) ...[
                  const SizedBox(width: 8),
                  _StatusBadge(
                    isPro: false,
                    freeAttemptsRemaining:
                        session.status!.freeAttemptsRemaining,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            _SectionCard(
              children: [
                _FieldLabel(ref.tr('iAm'), hint: ref.tr('iAmHint')),
                const SizedBox(height: 10),
                _EmploymentGrid(
                  value: form.employmentType,
                  onChanged: (v) =>
                      _update((f) => f.copyWith(employmentType: v)),
                ),
                const SizedBox(height: 18),
                _FieldLabel(
                  ref.tr('incomePeriod'),
                  hint: ref.tr('incomePeriodHint'),
                ),
                const SizedBox(height: 8),
                SegmentedToggle(
                  leftLabel: ref.tr('monthly'),
                  rightLabel: ref.tr('yearly'),
                  valueIsLeft: form.incomePeriod == IncomePeriod.monthly,
                  onChanged: (isLeft) => _update(
                    (f) => f.copyWith(
                      incomePeriod: isLeft
                          ? IncomePeriod.monthly
                          : IncomePeriod.yearly,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _FieldLabel(
                  form.incomePeriod == IncomePeriod.monthly
                      ? ref.tr('grossAmountMonthly')
                      : ref.tr('grossAmountYearly'),
                ),
                const SizedBox(height: 6),
                _NumberField(
                  controller: _grossCtrl,
                  onChanged: (v) => _update((f) => f.copyWith(grossAmount: v)),
                ),
                const SizedBox(height: 16),
                _FieldLabel(ref.tr('state'), hint: ref.tr('stateHint')),
                const SizedBox(height: 6),
                _StateDropdown(
                  value: form.state,
                  onChanged: (v) => _update((f) => f.copyWith(state: v)),
                ),
              ],
            ),

            const SizedBox(height: 14),

            _SectionCard(
              title: ref.tr('deductions'),
              children: [
                _FieldLabel(
                  ref.tr('soleEarner'),
                  hint: ref.tr('soleEarnerHint'),
                ),
                const SizedBox(height: 8),
                SegmentedToggle(
                  leftLabel: ref.tr('yes'),
                  rightLabel: ref.tr('no'),
                  valueIsLeft: form.soleEarnerDeduction,
                  onChanged: (isLeft) =>
                      _update((f) => f.copyWith(soleEarnerDeduction: isLeft)),
                ),
                const SizedBox(height: 16),
                _FieldLabel(
                  ref.tr('familyBonus'),
                  hint: ref.tr('familyBonusHint'),
                ),
                const SizedBox(height: 6),
                _FamilyBonusDropdown(
                  value: form.familyBonus,
                  onChanged: (v) => _update((f) => f.copyWith(familyBonus: v)),
                ),
                if (calcState.showChildrenFields) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _FieldLabel(ref.tr('childrenUnder18')),
                            const SizedBox(height: 6),
                            _NumberField(
                              controller: _childrenUnder18Ctrl,
                              isInteger: true,
                              onChanged: (v) => _update(
                                (f) => f.copyWith(childrenUnder18: v.toInt()),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _FieldLabel(ref.tr('childrenOver18')),
                            const SizedBox(height: 6),
                            _NumberField(
                              controller: _childrenOver18Ctrl,
                              isInteger: true,
                              onChanged: (v) => _update(
                                (f) => f.copyWith(
                                  childrenOver18WithFamilyAllowance: v.toInt(),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                _FieldLabel(
                  ref.tr('benefitInKind'),
                  hint: ref.tr('benefitInKindHint'),
                ),
                const SizedBox(height: 6),
                _NumberField(
                  controller: _benefitInKindCtrl,
                  onChanged: (v) =>
                      _update((f) => f.copyWith(benefitInKindMonthly: v)),
                ),
                const SizedBox(height: 16),
                _FieldLabel(
                  ref.tr('companyCarBenefit'),
                  hint: ref.tr('companyCarHint'),
                ),
                const SizedBox(height: 8),
                SegmentedToggle(
                  leftLabel: ref.tr('yes'),
                  rightLabel: ref.tr('no'),
                  valueIsLeft: form.benefitInKindFromCompanyCar,
                  onChanged: (isLeft) => _update((f) {
                    if (!isLeft) {
                      return f.copyWith(
                        benefitInKindFromCompanyCar: false,
                        companyCar: null,
                      );
                    }
                    return f.copyWith(
                      benefitInKindFromCompanyCar: true,
                      companyCar: CompanyCarInput(
                        acquisitionCost:
                            double.tryParse(_carCostCtrl.text) ?? 0,
                        co2GramsPerKm: int.tryParse(_carCo2Ctrl.text) ?? 0,
                        firstRegistrationYear:
                            int.tryParse(_carYearCtrl.text) ??
                            DateTime.now().year,
                      ),
                    );
                  }),
                ),
                if (form.benefitInKindFromCompanyCar) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _FieldLabel(ref.tr('companyCarAcquisitionCost')),
                            const SizedBox(height: 6),
                            _NumberField(
                              controller: _carCostCtrl,
                              onChanged: (v) => _update(
                                (f) => f.copyWith(
                                  companyCar: CompanyCarInput(
                                    acquisitionCost: v,
                                    co2GramsPerKm:
                                        f.companyCar?.co2GramsPerKm ?? 0,
                                    firstRegistrationYear:
                                        f.companyCar?.firstRegistrationYear ??
                                        DateTime.now().year,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _FieldLabel(ref.tr('companyCarCo2')),
                            const SizedBox(height: 6),
                            _NumberField(
                              controller: _carCo2Ctrl,
                              isInteger: true,
                              onChanged: (v) => _update(
                                (f) => f.copyWith(
                                  companyCar: CompanyCarInput(
                                    acquisitionCost:
                                        f.companyCar?.acquisitionCost ?? 0,
                                    co2GramsPerKm: v.toInt(),
                                    firstRegistrationYear:
                                        f.companyCar?.firstRegistrationYear ??
                                        DateTime.now().year,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                _FieldLabel(
                  ref.tr('taxFreeAllowance'),
                  hint: ref.tr('taxFreeAllowanceHint'),
                ),
                const SizedBox(height: 6),
                _NumberField(
                  controller: _taxFreeCtrl,
                  onChanged: (v) =>
                      _update((f) => f.copyWith(taxFreeAllowanceMonthly: v)),
                ),
              ],
            ),

            if (!form.benefitInKindFromCompanyCar) ...[
              const SizedBox(height: 14),
              _SectionCard(
                title: ref.tr('commute'),
                children: [
                  _FieldLabel(ref.tr('commuteKm')),
                  const SizedBox(height: 6),
                  _NumberField(
                    controller: _commuteKmCtrl,
                    onChanged: (v) =>
                        _update((f) => f.copyWith(commuteOneWayKm: v)),
                  ),
                  const SizedBox(height: 16),
                  _FieldLabel(ref.tr('publicTransportReasonable')),
                  const SizedBox(height: 8),
                  SegmentedToggle(
                    leftLabel: ref.tr('yes'),
                    rightLabel: ref.tr('no'),
                    valueIsLeft: form.publicTransportReasonable,
                    onChanged: (isLeft) => _update(
                      (f) => f.copyWith(publicTransportReasonable: isLeft),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _FieldLabel(ref.tr('commuteDays')),
                  const SizedBox(height: 6),
                  _CommuteDaysDropdown(
                    value: form.commuteDaysPerMonth,
                    onChanged: (v) =>
                        _update((f) => f.copyWith(commuteDaysPerMonth: v)),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: calcState.loading
                    ? null
                    : () => ref
                          .read(calculatorControllerProvider.notifier)
                          .submit(),
                child: calcState.loading
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(ref.tr('calculating')),
                        ],
                      )
                    : Text(ref.tr('calculate')),
              ),
            ),

            const SizedBox(height: 20),
            const ResultCard(),

            if (session.status != null && !isPro) ...[
              const SizedBox(height: 14),
              _AttemptsBanner(remaining: session.status!.freeAttemptsRemaining),
            ],
          ],
        ),
      ),
      bottomNavigationBar: const LegalDisclaimerFooter(),
    );
  }
}

/// Botón compacto (icono + "Pro") para no desbordar el encabezado en móviles estrechos;
/// el texto completo "Mejorar a Pro" va como tooltip y dentro de la comparativa.
/// Quien ya tiene cuenta entra desde la propia comparativa.
class _UpgradeButton extends ConsumerWidget {
  const _UpgradeButton({required this.onPressed, this.compact = false});
  final VoidCallback onPressed;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (compact) {
      return IconButton.filled(
        onPressed: onPressed,
        tooltip: ref.tr('upgradeCta'),
        icon: const Icon(Icons.workspace_premium_rounded, size: 18),
        visualDensity: VisualDensity.compact,
      );
    }
    return Tooltip(
      message: ref.tr('upgradeCta'),
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.workspace_premium_rounded, size: 16),
        label: Text(
          ref.tr('proBadge'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
        ),
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          minimumSize: const Size(0, 32),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          visualDensity: VisualDensity.compact,
        ),
      ),
    );
  }
}

class _StatusBadge extends ConsumerWidget {
  const _StatusBadge({required this.isPro, this.freeAttemptsRemaining});
  final bool isPro;
  final int? freeAttemptsRemaining;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (isPro) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.successTint,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          ref.tr('proBadge'),
          style: const TextStyle(
            color: AppColors.success,
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '${ref.tr('attemptsRemaining')}: ${freeAttemptsRemaining ?? 0}',
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w600,
          fontSize: 11.5,
        ),
      ),
    );
  }
}

class _LanguageMenu extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return PopupMenuButton<String>(
      tooltip: ref.tr('language'),
      initialValue: locale,
      icon: const Icon(
        Icons.language_rounded,
        size: 20,
        color: AppColors.textSecondary,
      ),
      itemBuilder: (context) => AppStrings.supportedLocales
          .map(
            (code) => PopupMenuItem(
              value: code,
              child: Text(AppStrings.localeLabels[code]!),
            ),
          )
          .toList(),
      onSelected: (value) {
        ref.read(localeProvider.notifier).state = value;
        ref.read(sharedPreferencesProvider).setString(localeStorageKey, value);
      },
    );
  }
}

class _AttemptsBanner extends ConsumerWidget {
  const _AttemptsBanner({required this.remaining});
  final int remaining;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final warning = remaining == 0;
    return AnimatedContainer(
      duration: AppMotion.base,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: warning ? AppColors.warningTint : AppColors.surfaceElevated,
        border: Border.all(
          color: warning
              ? AppColors.warning.withValues(alpha: 0.35)
              : AppColors.border,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '${ref.tr('attemptsRemaining')}: $remaining',
            style: const TextStyle(fontSize: 13.5),
          ),
          if (warning)
            TextButton(
              onPressed: () => showPaymentSheet(context),
              child: Text(ref.tr('upgradeToPro')),
            ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({this.title, required this.children});
  final String? title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const Divider(height: 22),
          ],
          ...children,
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {this.hint});
  final String text;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
        ),
        if (hint != null) ...[
          const SizedBox(height: 2),
          Text(
            hint!,
            style: const TextStyle(
              fontSize: 11.5,
              color: AppColors.textSecondary,
              height: 1.3,
            ),
          ),
        ],
      ],
    );
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.controller,
    required this.onChanged,
    this.isInteger = false,
  });
  final TextEditingController controller;
  final ValueChanged<double> onChanged;
  final bool isInteger;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.numberWithOptions(decimal: !isInteger),
      style: const TextStyle(fontSize: 15),
      onChanged: (raw) =>
          onChanged(double.tryParse(raw.replaceAll(',', '.')) ?? 0),
    );
  }
}

class _EmploymentGrid extends ConsumerWidget {
  const _EmploymentGrid({required this.value, required this.onChanged});
  final EmploymentType value;
  final ValueChanged<EmploymentType> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final options = [
      (
        EmploymentType.employee,
        ref.tr('employmentEmployee'),
        Icons.work_rounded,
      ),
      (
        EmploymentType.apprentice,
        ref.tr('employmentApprentice'),
        Icons.school_rounded,
      ),
      (
        EmploymentType.pensioner,
        ref.tr('employmentPensioner'),
        Icons.wb_sunny_rounded,
      ),
    ];

    return Row(
      children: options.map((opt) {
        final active = opt.$1 == value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: opt == options.last ? 0 : 8),
            child: GestureDetector(
              onTap: () => onChanged(opt.$1),
              child: AnimatedContainer(
                duration: AppMotion.base,
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 6,
                ),
                decoration: BoxDecoration(
                  color: active
                      ? AppColors.primary.withValues(alpha: 0.07)
                      : AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: active ? AppColors.primary : AppColors.border,
                    width: active ? 1.4 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: AppMotion.base,
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.primary
                            : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Icon(
                        opt.$3,
                        size: 18,
                        color: active ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      opt.$2,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: active
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StateDropdown extends ConsumerWidget {
  const _StateDropdown({required this.value, required this.onChanged});
  final AustrianState value;
  final ValueChanged<AustrianState> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _StyledDropdown<AustrianState>(
      value: value,
      items: AustrianState.values,
      labelOf: (s) => ref.tr('state_${s.wire}'),
      onChanged: onChanged,
    );
  }
}

class _FamilyBonusDropdown extends ConsumerWidget {
  const _FamilyBonusDropdown({required this.value, required this.onChanged});
  final FamilyBonusType value;
  final ValueChanged<FamilyBonusType> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const labelKeys = {
      FamilyBonusType.none: 'familyBonusNone',
      FamilyBonusType.full: 'familyBonusFull',
      FamilyBonusType.shared: 'familyBonusShared',
    };
    return _StyledDropdown<FamilyBonusType>(
      value: value,
      items: FamilyBonusType.values,
      labelOf: (v) => ref.tr(labelKeys[v]!),
      onChanged: onChanged,
    );
  }
}

class _CommuteDaysDropdown extends ConsumerWidget {
  const _CommuteDaysDropdown({required this.value, required this.onChanged});
  final CommuteDaysPerMonth value;
  final ValueChanged<CommuteDaysPerMonth> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const labelKeys = {
      CommuteDaysPerMonth.lessThan4: 'commuteDaysLess4',
      CommuteDaysPerMonth.from4to7: 'commuteDays4to7',
      CommuteDaysPerMonth.from8to10: 'commuteDays8to10',
      CommuteDaysPerMonth.moreThan10: 'commuteDaysMore10',
    };
    return _StyledDropdown<CommuteDaysPerMonth>(
      value: value,
      items: CommuteDaysPerMonth.values,
      labelOf: (v) => ref.tr(labelKeys[v]!),
      onChanged: onChanged,
    );
  }
}

class _StyledDropdown<T> extends StatelessWidget {
  const _StyledDropdown({
    required this.value,
    required this.items,
    required this.labelOf,
    required this.onChanged,
  });
  final T value;
  final List<T> items;
  final String Function(T) labelOf;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          icon: const Icon(
            Icons.expand_more_rounded,
            color: AppColors.textSecondary,
          ),
          items: items
              .map((v) => DropdownMenuItem(value: v, child: Text(labelOf(v))))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}
