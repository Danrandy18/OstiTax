import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../session/presentation/session_controller.dart';

enum _PayMethod { stripe, paypal }

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

  Future<void> _pay(_PayMethod method) async {
    final deviceId = ref.read(sessionControllerProvider).status?.deviceId;
    if (deviceId == null) return;

    setState(() {
      _loading = method;
      _error = null;
    });

    try {
      final billing = ref.read(billingRepositoryProvider);
      final url = method == _PayMethod.stripe
          ? (await billing.createStripeCheckout(deviceId)).url
          : (await billing.createPaypalSubscription(deviceId)).approvalUrl;

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
    await ref.read(sessionControllerProvider.notifier).refresh();
    if (mounted && ref.read(sessionControllerProvider).status?.isPro == true) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(20),
        ),
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
            ] else ...[
              _PayButton(
                label: ref.tr('payWithStripe'),
                icon: Icons.credit_card_rounded,
                loading: _loading == _PayMethod.stripe,
                filled: true,
                onTap: () => _pay(_PayMethod.stripe),
              ),
              const SizedBox(height: 10),
              _PayButton(
                label: ref.tr('payWithPaypal'),
                icon: Icons.account_balance_wallet_rounded,
                loading: _loading == _PayMethod.paypal,
                filled: false,
                onTap: () => _pay(_PayMethod.paypal),
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
