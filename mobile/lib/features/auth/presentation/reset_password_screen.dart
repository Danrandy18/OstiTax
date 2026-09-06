import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, required this.token});

  final String? token;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _done = false;
  String? _error;

  @override
  void dispose() {
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final token = widget.token;
    if (token == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref
          .read(authRepositoryProvider)
          .resetPassword(token, _passwordCtrl.text);
      if (!mounted) return;
      setState(() {
        _loading = false;
        _done = true;
      });
      Future.delayed(const Duration(milliseconds: 2000), () {
        if (mounted) context.go('/calculator');
      });
    } on ApiException {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ref.tr('authResetPasswordInvalidToken');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(ref.tr('authResetPasswordTitle'))),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: widget.token == null
              ? Text(
                  ref.tr('authResetPasswordInvalidToken'),
                  style: const TextStyle(color: AppColors.error),
                )
              : _done
              ? Text(ref.tr('authResetPasswordSuccess'))
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _passwordCtrl,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: ref.tr('authNewPasswordLabel'),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ],
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(ref.tr('authResetPasswordButton')),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
