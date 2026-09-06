import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import 'auth_controller.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

enum _AuthMode { login, register }

class _AuthScreenState extends ConsumerState<AuthScreen> {
  _AuthMode _mode = _AuthMode.login;
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final notifier = ref.read(authControllerProvider.notifier);
    final ok = _mode == _AuthMode.login
        ? await notifier.login(_emailCtrl.text.trim(), _passwordCtrl.text)
        : await notifier.register(
            _emailCtrl.text.trim(),
            _passwordCtrl.text,
            _nameCtrl.text.trim().isEmpty ? null : _nameCtrl.text.trim(),
          );

    if (!mounted) return;

    if (ok) {
      Navigator.of(context).pop();
      return;
    }

    setState(() {
      _loading = false;
      _error = ref.read(authControllerProvider).error ?? ref.tr('authErrorGeneric');
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLogin = _mode == _AuthMode.login;

    return Scaffold(
      appBar: AppBar(
        title: Text(ref.tr(isLogin ? 'authLoginTitle' : 'authRegisterTitle')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isLogin) ...[
                _Field(
                  label: ref.tr('authNameOptional'),
                  controller: _nameCtrl,
                ),
                const SizedBox(height: 12),
              ],
              _Field(
                label: ref.tr('authEmailLabel'),
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              _Field(
                label: ref.tr('authPasswordLabel'),
                controller: _passwordCtrl,
                obscureText: true,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error, fontSize: 13),
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
                    : Text(ref.tr(isLogin ? 'authLoginButton' : 'authRegisterButton')),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _loading
                    ? null
                    : () => setState(() {
                        _mode = isLogin ? _AuthMode.register : _AuthMode.login;
                        _error = null;
                      }),
                child: Text(
                  ref.tr(isLogin ? 'authSwitchToRegister' : 'authSwitchToLogin'),
                ),
              ),
              if (isLogin)
                TextButton(
                  onPressed: _loading
                      ? null
                      : () => context.push('/forgot-password'),
                  child: Text(
                    ref.tr('authForgotPasswordLink'),
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label),
    );
  }
}
