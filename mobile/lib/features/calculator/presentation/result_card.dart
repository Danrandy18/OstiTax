import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/count_up_text.dart';
import '../domain/calculation_models.dart';
import 'calculator_controller.dart';
import 'pdf_export_button.dart';

class ResultCard extends ConsumerWidget {
  const ResultCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(calculatorControllerProvider);
    final result = state.result;

    if (result == null) {
      return _EmptyResultCard(loading: state.loading);
    }

    final breakdown = state.activeBreakdown!;
    final selfEmployed = result.selfEmployed;

    return AnimatedSwitcher(
      duration: AppMotion.slow,
      switchInCurve: Curves.easeOutCubic,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.03),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        ),
      ),
      child: Container(
        key: const ValueKey('result'),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    ref.tr('results'),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${ref.tr('tableYear')}: ${result.tableYear}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _TabRow(),
            const SizedBox(height: 16),
            _BreakdownRow(
              label: ref.tr(selfEmployed != null ? 'seProfit' : 'gross'),
              value: breakdown.gross,
            ),
            const SizedBox(height: 8),
            _BreakdownRow(
              label: ref.tr(
                selfEmployed != null ? 'seSocialInsurance' : 'socialInsurance',
              ),
              value: breakdown.socialInsurance,
              deduction: true,
            ),
            const SizedBox(height: 8),
            _BreakdownRow(
              label: ref.tr('incomeTax'),
              value: breakdown.incomeTax,
              deduction: true,
            ),
            const SizedBox(height: 12),
            _NetRow(
              value: breakdown.net,
              key: ValueKey('net-${state.activeTab}-${breakdown.net}'),
            ),
            if (selfEmployed != null) ...[
              const SizedBox(height: 16),
              _SelfEmployedDetail(detail: selfEmployed),
            ],
            const SizedBox(height: 14),
            const PdfExportButton(),
          ],
        ),
      ),
    );
  }
}

class _TabRow extends ConsumerWidget {
  const _TabRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(calculatorControllerProvider);
    final active = state.activeTab;
    // Autonomos: sin 13./14. Bezug; solo la media mensual y el año.
    final tabs = state.result?.selfEmployed != null
        ? [
            (ResultTab.recurring, ref.tr('seMonthlyAverage')),
            (ResultTab.annual, ref.tr('annual')),
          ]
        : [
            (ResultTab.recurring, ref.tr('recurring')),
            (ResultTab.thirteenth, ref.tr('thirteenth')),
            (ResultTab.fourteenth, ref.tr('fourteenth')),
            (ResultTab.annual, ref.tr('annual')),
          ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: tabs.map((tab) {
          final isActive = tab.$1 == active;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: AnimatedContainer(
              duration: AppMotion.base,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isActive ? AppColors.primary : AppColors.border,
                ),
                borderRadius: BorderRadius.circular(999),
              ),
              child: InkWell(
                onTap: () => ref
                    .read(calculatorControllerProvider.notifier)
                    .setActiveTab(tab.$1),
                child: Text(
                  tab.$2,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: isActive ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  const _BreakdownRow({
    required this.label,
    required this.value,
    this.deduction = false,
  });

  final String label;
  final double value;
  final bool deduction;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Las etiquetas largas (p. ej. "SVS-Beiträge gesamt") pasan a dos líneas en 360 px.
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13.5,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Row(
          children: [
            if (deduction)
              const Padding(
                padding: EdgeInsets.only(right: 3),
                child: Text(
                  '-',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            CountUpText(
              value: value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: deduction
                    ? AppColors.textSecondary
                    : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _NetRow extends StatefulWidget {
  const _NetRow({super.key, required this.value});
  final double value;

  @override
  State<_NetRow> createState() => _NetRowState();
}

class _NetRowState extends State<_NetRow> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.slow)
      ..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.successTint,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  ScaleTransition(
                    scale: CurvedAnimation(
                      parent: _controller,
                      curve: const Interval(0.3, 1, curve: Curves.elasticOut),
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.success,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    ref.tr('net'),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              // Importes grandes (autonomos: neto anual de 6 cifras) se encogen en vez de desbordar.
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: CountUpText(
                    value: widget.value,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                      fontSize: 21,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _EmptyResultCard extends ConsumerWidget {
  const _EmptyResultCard({required this.loading});
  final bool loading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: loading
            ? const CircularProgressIndicator(
                strokeWidth: 2.4,
                color: AppColors.primary,
              )
            : Column(
                children: [
                  const Icon(
                    Icons.receipt_long_rounded,
                    size: 40,
                    color: AppColors.border,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    ref.tr('emptyResultsTitle'),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ref.tr('emptyResultsBody'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Autonomos: desglose anual (SVS, Gewinnfreibetrag, impuesto), pagos trimestrales y avisos.
class _SelfEmployedDetail extends ConsumerWidget {
  const _SelfEmployedDetail({required this.detail});
  final SelfEmployedBreakdown detail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final money = NumberFormat.currency(
      locale: 'de_DE',
      symbol: '€',
      decimalDigits: 2,
    );
    final d = detail;

    Widget line(
      String key,
      double value, {
      bool minus = false,
      bool strong = false,
    }) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                ref.tr(key),
                style: TextStyle(
                  fontSize: 12.5,
                  color: strong
                      ? AppColors.textPrimary
                      : AppColors.textSecondary,
                  fontWeight: strong ? FontWeight.w700 : FontWeight.w400,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${minus ? '- ' : ''}${money.format(value)}',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      );
    }

    final note = !d.insured
        ? 'seNotInsuredNote'
        : d.minimumBaseApplied
        ? 'seMinBaseNote'
        : d.maximumBaseApplied
        ? 'seMaxBaseNote'
        : null;
    final backPayment =
        d.estimatedBackPayment != null && d.provisionalSocialInsurance != null
        ? ref
              .tr('seBackPayment')
              .replaceAll(
                '{provisional}',
                money.format(d.provisionalSocialInsurance),
              )
              .replaceAll('{final}', money.format(d.socialInsurance))
              .replaceAll('{backPayment}', money.format(d.estimatedBackPayment))
        : null;

    return Column(
      key: const Key('selfEmployedDetail'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 1),
        const SizedBox(height: 12),
        Text(
          ref.tr('seDetailTitle'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
        ),
        if (note != null) ...[
          const SizedBox(height: 6),
          Text(
            ref.tr(note),
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
        const SizedBox(height: 6),
        line('seProfit', d.annualProfit, strong: true),
        if (d.insured) ...[
          line('sePension', d.pension, minus: true),
          line('seHealth', d.health, minus: true),
          line('seProvision', d.provision, minus: true),
          line('seAccident', d.accident, minus: true),
        ],
        line('seSocialInsurance', d.socialInsurance, minus: true, strong: true),
        line('seGewinnfreibetrag', d.gewinnfreibetrag, minus: true),
        line('seTaxable', d.taxableIncome),
        line('seTariffTax', d.tariffTax),
        if (d.familyBonus > 0)
          line('seFamilyBonus', d.familyBonus, minus: true),
        if (d.soleEarnerCredit > 0)
          line('seSoleEarner', d.soleEarnerCredit, minus: true),
        line('seIncomeTax', d.incomeTax, minus: true, strong: true),
        line('seNet', d.net, strong: true),
        const SizedBox(height: 10),
        Text(
          ref.tr('seQuarterlyTitle'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        ),
        line('seQuarterlySocialInsurance', d.quarterlySocialInsurance),
        line('seQuarterlyTax', d.quarterlyTaxPrepayment),
        if (backPayment != null) ...[
          const SizedBox(height: 8),
          Container(
            key: const Key('selfEmployedBackPayment'),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.warningTint,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              backPayment,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
        const SizedBox(height: 8),
        Text(
          ref.tr('seDisclaimer'),
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
