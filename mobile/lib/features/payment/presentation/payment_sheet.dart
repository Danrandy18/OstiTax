import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_controller.dart';

enum _PayMethod { stripe, paypal }

enum _AuthFormMode { login, register }

enum _PlanSegment {
  individual('individual', 'segmentIndividualLabel'),
  company('company', 'segmentCompanyLabel');

  const _PlanSegment(this.value, this.labelKey);

  final String value;
  final String labelKey;
}

enum _PlanPeriod { monthly, annual }

class _PlanInfo {
  const _PlanInfo({
    required this.period,
    required this.titleKey,
    required this.priceKey,
    required this.benefitKey,
    this.perMonthKey,
    this.badgeKey,
    this.highlight = false,
  });

  final _PlanPeriod period;
  final String titleKey;
  final String priceKey;
  final String benefitKey;
  final String? perMonthKey;
  final String? badgeKey;
  final bool highlight;
}

List<_PlanInfo> _plansFor(_PlanSegment segment) {
  final isCompany = segment == _PlanSegment.company;
  return [
    _PlanInfo(
      period: _PlanPeriod.monthly,
      titleKey: 'planMonthlyTitle',
      priceKey: isCompany ? 'planMonthlyPriceCompany' : 'planMonthlyPrice',
      benefitKey: 'planMonthlyBenefit',
    ),
    _PlanInfo(
      period: _PlanPeriod.annual,
      titleKey: 'planAnnualTitle',
      priceKey: isCompany ? 'planAnnualPriceCompany' : 'planAnnualPrice',
      perMonthKey: isCompany
          ? 'planAnnualPerMonthCompany'
          : 'planAnnualPerMonth',
      badgeKey: 'planAnnualBadge',
      benefitKey: 'planAnnualBenefit',
      highlight: true,
    ),
  ];
}

Future<void> showPaymentSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const PaymentSheet(),
  );
}

class PaymentSheet extends ConsumerStatefulWidget {
  const PaymentSheet({super.key});

  @override
  ConsumerState<PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<PaymentSheet> {
  _PayMethod? _loading;
  String? _error;
  bool _opened = false;
  _PlanSegment _selectedSegment = _PlanSegment.individual;
  _PlanPeriod _selectedPeriod = _PlanPeriod.monthly;
  _PayMethod _selectedMethod = _PayMethod.stripe;

  _AuthFormMode _authMode = _AuthFormMode.login;
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _authLoading = false;
  String? _authError;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitAuth() async {
    setState(() {
      _authLoading = true;
      _authError = null;
    });

    final notifier = ref.read(authControllerProvider.notifier);
    final ok = _authMode == _AuthFormMode.login
        ? await notifier.login(_emailCtrl.text.trim(), _passwordCtrl.text)
        : await notifier.register(
            _emailCtrl.text.trim(),
            _passwordCtrl.text,
            _nameCtrl.text.trim().isEmpty ? null : _nameCtrl.text.trim(),
          );

    if (!mounted) return;
    setState(() {
      _authLoading = false;
      if (!ok) {
        _authError = ref.read(authControllerProvider).error ?? ref.tr('authErrorGeneric');
      }
    });
  }

  Future<void> _pay() async {
    final method = _selectedMethod;
    final token = ref.read(authControllerProvider).token;
    if (token == null) return;

    setState(() {
      _loading = method;
      _error = null;
    });

    try {
      final billing = ref.read(billingRepositoryProvider);
      final interval =
          '${_selectedSegment.value}_${_selectedPeriod.name}';
      final url = method == _PayMethod.stripe
          ? (await billing.createStripeCheckout(token, interval)).url
          : (await billing.createPaypalSubscription(
              token,
              interval,
            )).approvalUrl;

      final uri = Uri.parse(url);
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) throw Exception('launch-failed');

      if (mounted) {
        setState(() {
          _loading = null;
          _opened = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = null;
          _error = ref.tr('errorGeneric');
        });
      }
    }
  }

  Future<void> _refreshStatus() async {
    await ref.read(authControllerProvider.notifier).refreshAccount();
    if (mounted && ref.read(authControllerProvider).account?.isPro == true) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAuthenticated = ref.watch(authControllerProvider).isAuthenticated;
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.88,
        ),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(20),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ref.tr('paymentModalTitle'),
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ref.tr('paymentModalSubtitle'),
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (_opened) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.successTint,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ref.tr('paymentOpenedTitle'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                            ),
                            Text(
                              ref.tr('paymentOpenedBody'),
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _refreshStatus,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: Text(ref.tr('refreshStatus')),
                  ),
                ),
              ] else if (!isAuthenticated) ...[
                Text(
                  ref.tr(
                    _authMode == _AuthFormMode.login
                        ? 'authLoginTitle'
                        : 'authRegisterTitle',
                  ),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                if (_authMode == _AuthFormMode.register) ...[
                  TextField(
                    controller: _nameCtrl,
                    decoration: InputDecoration(
                      labelText: ref.tr('authNameOptional'),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(labelText: ref.tr('authEmailLabel')),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _passwordCtrl,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: ref.tr('authPasswordLabel'),
                  ),
                ),
                if (_authError != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _authError!,
                    style: const TextStyle(color: AppColors.error, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: _PayButton(
                    label: ref.tr(
                      _authMode == _AuthFormMode.login
                          ? 'authLoginButton'
                          : 'authRegisterButton',
                    ),
                    icon: Icons.login_rounded,
                    loading: _authLoading,
                    filled: true,
                    onTap: _submitAuth,
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _authLoading
                      ? null
                      : () => setState(() {
                          _authMode = _authMode == _AuthFormMode.login
                              ? _AuthFormMode.register
                              : _AuthFormMode.login;
                          _authError = null;
                        }),
                  child: Text(
                    ref.tr(
                      _authMode == _AuthFormMode.login
                          ? 'authSwitchToRegister'
                          : 'authSwitchToLogin',
                    ),
                  ),
                ),
              ] else ...[
                _SectionHeading(text: ref.tr('segmentSelectHeading')),
                const SizedBox(height: 8),
                Row(
                  children: [
                    for (final seg in _PlanSegment.values) ...[
                      Expanded(
                        child: _SegmentChip(
                          label: ref.tr(seg.labelKey),
                          selected: _selectedSegment == seg,
                          onTap: () =>
                              setState(() => _selectedSegment = seg),
                        ),
                      ),
                      if (seg != _PlanSegment.values.last)
                        const SizedBox(width: 8),
                    ],
                  ],
                ),
                const SizedBox(height: 14),
                _SectionHeading(text: ref.tr('planSelectHeading')),
                const SizedBox(height: 8),
                for (final plan in _plansFor(_selectedSegment)) ...[
                  _PlanCard(
                    title: ref.tr(plan.titleKey),
                    price: ref.tr(plan.priceKey),
                    benefit: ref.tr(plan.benefitKey),
                    perMonth: plan.perMonthKey != null
                        ? ref.tr(plan.perMonthKey!)
                        : null,
                    badge: plan.badgeKey != null
                        ? ref.tr(plan.badgeKey!)
                        : null,
                    highlight: plan.highlight,
                    selected: _selectedPeriod == plan.period,
                    onTap: () =>
                        setState(() => _selectedPeriod = plan.period),
                  ),
                  const SizedBox(height: 8),
                ],
                const SizedBox(height: 10),
                _SectionHeading(text: ref.tr('paymentMethodHeading')),
                const SizedBox(height: 8),
                _MethodCard(
                  selected: _selectedMethod == _PayMethod.stripe,
                  onTap: () =>
                      setState(() => _selectedMethod = _PayMethod.stripe),
                  leading: const _MiniCard(),
                  title: ref.tr('payMethodCardTitle'),
                  subtitle: ref.tr('payMethodCardDesc'),
                ),
                const SizedBox(height: 8),
                _MethodCard(
                  selected: _selectedMethod == _PayMethod.paypal,
                  onTap: () =>
                      setState(() => _selectedMethod = _PayMethod.paypal),
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF003087), Color(0xFF009CDE)],
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'P',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                  title: ref.tr('payMethodPaypalTitle'),
                  subtitle: ref.tr('payMethodPaypalDesc'),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: _PayButton(
                    label: _selectedMethod == _PayMethod.stripe
                        ? ref.tr('payWithStripe')
                        : ref.tr('payWithPaypal'),
                    icon: _selectedMethod == _PayMethod.stripe
                        ? Icons.credit_card_rounded
                        : Icons.account_balance_wallet_rounded,
                    loading: _loading != null,
                    filled: true,
                    onTap: _pay,
                  ),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error, fontSize: 13),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11.5,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.4,
        color: AppColors.textSecondary,
      ),
    );
  }
}

class _SegmentChip extends StatelessWidget {
  const _SegmentChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.06)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: selected ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.price,
    required this.benefit,
    required this.highlight,
    required this.selected,
    required this.onTap,
    this.perMonth,
    this.badge,
  });

  final String title;
  final String price;
  final String benefit;
  final String? perMonth;
  final String? badge;
  final bool highlight;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected
        ? (highlight ? AppColors.success : AppColors.primary)
        : AppColors.border;
    final tint = selected
        ? (highlight ? AppColors.success : AppColors.primary).withValues(
            alpha: 0.06,
          )
        : AppColors.surface;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: tint,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              size: 20,
              color: selected ? borderColor : AppColors.textSecondary,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            badge!,
                            style: const TextStyle(
                              color: AppColors.success,
                              fontWeight: FontWeight.w800,
                              fontSize: 10.5,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(price, style: const TextStyle(fontSize: 13.5)),
                  if (perMonth != null)
                    Text(
                      perMonth!,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  const SizedBox(height: 3),
                  Text(
                    benefit,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.selected,
    required this.onTap,
    required this.leading,
    required this.title,
    required this.subtitle,
  });

  final bool selected;
  final VoidCallback onTap;
  final Widget leading;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.06)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected ? AppColors.primary : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

/// Vista previa "futurista" de una tarjeta, solo decorativa: comunica que el
/// pago con Visa/Mastercard se hace via Stripe sin pedir datos reales aqui.
class _MiniCard extends StatelessWidget {
  const _MiniCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0F2027), Color(0xFF1D5C56), Color(0xFF0D5C56)],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 12,
            height: 9,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              gradient: const LinearGradient(
                colors: [Color(0xFFFFE9A8), Color(0xFFD4A94F)],
              ),
            ),
          ),
          const Align(
            alignment: Alignment.centerRight,
            child: Text(
              'VISA',
              style: TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PayButton extends StatelessWidget {
  const _PayButton({
    required this.label,
    required this.icon,
    required this.loading,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool loading;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 19),
              const SizedBox(width: 10),
              Text(label),
            ],
          );

    if (filled) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(onPressed: loading ? null : onTap, child: child),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(onPressed: loading ? null : onTap, child: child),
    );
  }
}
