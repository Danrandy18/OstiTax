
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/feature_flags.dart';
import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/legal_disclaimer_footer.dart';
import '../../auth/presentation/auth_controller.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _deleting = false;

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(ref.tr('profileDeleteConfirmTitle')),
        content: Text(ref.tr('profileDeleteConfirmBody')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(ref.tr('profileDeleteCancelButton')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text(ref.tr('profileDeleteConfirmButton')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _deleting = true);
    final ok = await ref.read(authControllerProvider.notifier).deleteAccount();
    if (!mounted) return;

    if (ok) {
      Navigator.of(context).pop();
    } else {
      setState(() => _deleting = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(ref.tr('authErrorGeneric'))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = ref.watch(authControllerProvider).account;

    if (account == null) {
      return Scaffold(
        appBar: AppBar(title: Text(ref.tr('profileTitle'))),
        body: const SizedBox.shrink(),
        bottomNavigationBar: const LegalDisclaimerFooter(),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(ref.tr('profileTitle'))),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Row(
                    label: ref.tr('profileEmailLabel'),
                    value: account.email,
                  ),
                  if (account.name != null) ...[
                    const SizedBox(height: 10),
                    _Row(
                      label: ref.tr('profileNameLabel'),
                      value: account.name!,
                    ),
                  ],
                  const SizedBox(height: 10),
                  _Row(
                    label: ref.tr('profilePlanLabel'),
                    value: ref.tr(
                      account.isPro ? 'profilePlanPro' : 'profilePlanFree',
                    ),
                  ),
                  if (bankingEnabled) ...[
                    const SizedBox(height: 14),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: () => context.push('/banking'),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(ref.tr('profileConnectBankLink')),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.error.withValues(alpha: 0.3),
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ref.tr('profileDangerZoneTitle'),
                    style: const TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _deleting ? null : _confirmDelete,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      foregroundColor: Colors.white,
                    ),
                    child: _deleting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(ref.tr('profileDeleteAccountButton')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const LegalDisclaimerFooter(),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
