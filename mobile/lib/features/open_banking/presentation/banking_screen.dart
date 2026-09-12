import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/legal_disclaimer_footer.dart';
import '../../auth/presentation/auth_controller.dart';
import '../domain/bank_models.dart';

class BankingScreen extends ConsumerStatefulWidget {
  const BankingScreen({super.key});

  @override
  ConsumerState<BankingScreen> createState() => _BankingScreenState();
}

class _BankingScreenState extends ConsumerState<BankingScreen> {
  List<BankInstitution>? _institutions;
  List<BankConnection> _connections = [];
  List<BankTransaction> _transactions = [];
  bool _loadingInstitutions = false;
  String? _connectingId;
  String? _syncingId;
  String? _error;
  bool _opened = false;

  @override
  void initState() {
    super.initState();
    if (ref.read(authControllerProvider).isAuthenticated) {
      _loadConnections();
    }
  }

  Future<void> _loadConnections() async {
    final token = ref.read(authControllerProvider).token;
    if (token == null) return;
    try {
      final repo = ref.read(openBankingRepositoryProvider);
      final connections = await repo.listConnections(token);
      final transactions = await repo.listTransactions(token);
      if (!mounted) return;
      setState(() {
        _connections = connections;
        _transactions = transactions;
      });
    } catch (_) {
      if (mounted) setState(() => _error = ref.tr('errorGeneric'));
    }
  }

  Future<void> _loadInstitutions() async {
    if (_institutions != null) return;
    final token = ref.read(authControllerProvider).token;
    if (token == null) return;
    setState(() => _loadingInstitutions = true);
    try {
      final repo = ref.read(openBankingRepositoryProvider);
      final institutions = await repo.listInstitutions(token);
      if (!mounted) return;
      setState(() {
        _institutions = institutions;
        _loadingInstitutions = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _institutions = [];
          _loadingInstitutions = false;
          _error = ref.tr('errorGeneric');
        });
      }
    }
  }

  Future<void> _connect(String institutionId) async {
    final token = ref.read(authControllerProvider).token;
    if (token == null) return;
    setState(() {
      _connectingId = institutionId;
      _error = null;
    });
    try {
      final repo = ref.read(openBankingRepositoryProvider);
      final redirectUrl = await repo.startLink(token, institutionId);
      final launched = await launchUrl(
        Uri.parse(redirectUrl),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) throw Exception('launch-failed');
      if (mounted) {
        setState(() {
          _connectingId = null;
          _opened = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _connectingId = null;
          _error = ref.tr('errorGeneric');
        });
      }
    }
  }

  Future<void> _sync(String connectionId) async {
    final token = ref.read(authControllerProvider).token;
    if (token == null) return;
    setState(() {
      _syncingId = connectionId;
      _error = null;
    });
    try {
      final repo = ref.read(openBankingRepositoryProvider);
      await repo.syncTransactions(token, connectionId);
      await _loadConnections();
    } catch (_) {
      if (mounted) setState(() => _error = ref.tr('errorGeneric'));
    } finally {
      if (mounted) setState(() => _syncingId = null);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return ref.tr('bankingStatusPending');
      case 'linked':
        return ref.tr('bankingStatusLinked');
      case 'expired':
        return ref.tr('bankingStatusExpired');
      default:
        return ref.tr('bankingStatusError');
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'linked':
        return AppColors.success;
      case 'pending':
        return AppColors.textSecondary;
      default:
        return AppColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAuthenticated = ref.watch(authControllerProvider).isAuthenticated;

    return Scaffold(
      appBar: AppBar(title: Text(ref.tr('bankingPageTitle'))),
      body: SafeArea(
        child: !isAuthenticated
            ? Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  ref.tr('bankingLoginRequired'),
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadConnections,
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Text(
                      ref.tr('bankingPageSubtitle'),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 20),
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
                              child: Text(
                                ref.tr('paymentOpenedBody'),
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _loadConnections,
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: Text(ref.tr('refreshStatus')),
                      ),
                      const SizedBox(height: 20),
                    ],
                    _Heading(text: ref.tr('bankingConnectionsHeading')),
                    const SizedBox(height: 8),
                    if (_connections.isEmpty)
                      Text(
                        ref.tr('bankingNoConnections'),
                        style: const TextStyle(color: AppColors.textSecondary),
                      )
                    else
                      for (final connection in _connections) ...[
                        _ConnectionTile(
                          name: connection.institutionName ??
                              connection.institutionId,
                          statusLabel: _statusLabel(connection.status),
                          statusColor: _statusColor(connection.status),
                          syncing: _syncingId == connection.id,
                          showSync: connection.status == 'linked',
                          onSync: () => _sync(connection.id),
                          syncLabel: ref.tr('bankingSyncButton'),
                          syncingLabel: ref.tr('bankingSyncing'),
                        ),
                        const SizedBox(height: 8),
                      ],
                    const SizedBox(height: 20),
                    _Heading(text: ref.tr('bankingSelectInstitution')),
                    const SizedBox(height: 8),
                    if (_institutions == null)
                      OutlinedButton(
                        onPressed: _loadInstitutions,
                        child: Text(ref.tr('bankingSelectInstitution')),
                      )
                    else if (_loadingInstitutions)
                      Text(ref.tr('loading'))
                    else if (_institutions!.isEmpty)
                      Text(
                        ref.tr('bankingNoInstitutions'),
                        style: const TextStyle(color: AppColors.textSecondary),
                      )
                    else
                      for (final institution in _institutions!) ...[
                        _InstitutionTile(
                          name: institution.name,
                          connecting: _connectingId == institution.id,
                          connectLabel: ref.tr('bankingConnectButton'),
                          onTap: () => _connect(institution.id),
                        ),
                        const SizedBox(height: 8),
                      ],
                    const SizedBox(height: 20),
                    _Heading(text: ref.tr('bankingTransactionsHeading')),
                    const SizedBox(height: 8),
                    if (_transactions.isEmpty)
                      Text(
                        ref.tr('bankingNoTransactions'),
                        style: const TextStyle(color: AppColors.textSecondary),
                      )
                    else
                      for (final txn in _transactions) ...[
                        _TransactionTile(txn: txn),
                        const SizedBox(height: 6),
                      ],
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ],
                  ],
                ),
              ),
      ),
      bottomNavigationBar: const LegalDisclaimerFooter(),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading({required this.text});

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

class _ConnectionTile extends StatelessWidget {
  const _ConnectionTile({
    required this.name,
    required this.statusLabel,
    required this.statusColor,
    required this.syncing,
    required this.showSync,
    required this.onSync,
    required this.syncLabel,
    required this.syncingLabel,
  });

  final String name;
  final String statusLabel;
  final Color statusColor;
  final bool syncing;
  final bool showSync;
  final VoidCallback onSync;
  final String syncLabel;
  final String syncingLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (showSync)
            TextButton(
              onPressed: syncing ? null : onSync,
              child: Text(syncing ? syncingLabel : syncLabel),
            ),
        ],
      ),
    );
  }
}

class _InstitutionTile extends StatelessWidget {
  const _InstitutionTile({
    required this.name,
    required this.connecting,
    required this.connectLabel,
    required this.onTap,
  });

  final String name;
  final bool connecting;
  final String connectLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: connecting ? null : onTap,
            child: connecting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(connectLabel),
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.txn});

  final BankTransaction txn;

  @override
  Widget build(BuildContext context) {
    final amount = double.tryParse(txn.amount) ?? 0;
    return Row(
      children: [
        SizedBox(
          width: 72,
          child: Text(
            txn.bookingDate ?? '—',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
        Expanded(
          child: Text(
            txn.counterpartyName ?? txn.remittanceInfo ?? '—',
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13),
          ),
        ),
        Text(
          '${txn.amount} ${txn.currency}',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: amount < 0 ? AppColors.error : AppColors.success,
          ),
        ),
      ],
    );
  }
}
