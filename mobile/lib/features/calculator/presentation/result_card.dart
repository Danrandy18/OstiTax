import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/count_up_text.dart';
import 'calculator_controller.dart';

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
                Text(
                  ref.tr('results'),
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
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
            _BreakdownRow(label: ref.tr('gross'), value: breakdown.gross),
            const SizedBox(height: 8),
            _BreakdownRow(
              label: ref.tr('socialInsurance'),
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
    final active = ref.watch(calculatorControllerProvider).activeTab;
    final tabs = [
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
        Text(
          label,
          style: const TextStyle(
            fontSize: 13.5,
            color: AppColors.textSecondary,
          ),
        ),
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
              CountUpText(
                value: widget.value,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.success,
                  fontSize: 21,
                  letterSpacing: -0.3,
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
