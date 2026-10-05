import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/tr.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/legal_disclaimer_footer.dart';
import '../../auth/presentation/auth_controller.dart';

const _minPasswordLength = 8;

/// Cambiar la contraseña con la sesión iniciada. El backend exige la actual, cierra las
/// demás sesiones y envía un correo de confirmación en el idioma de la app.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _saving = false;
  bool _done = false;
  String? _errorKey;

  @override
  void initState() {
    super.initState();
    for (final c in [_current, _new, _confirm]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      !_saving &&
      _current.text.isNotEmpty &&
      _new.text.length >= _minPasswordLength &&
      _confirm.text.isNotEmpty;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _errorKey = null;
      _done = false;
    });
    if (_new.text != _confirm.text) {
      setState(() => _errorKey = 'profilePasswordMismatch');
      return;
    }

    setState(() => _saving = true);
    final code = await ref
        .read(authControllerProvider.notifier)
        .changePassword(_current.text, _new.text);
    if (!mounted) return;

    setState(() {
      _saving = false;
      if (code == null) {
        _done = true;
        _current.clear();
        _new.clear();
        _confirm.clear();
        _obscure = true;
      } else {
        _errorKey = switch (code) {
          'WRONG_PASSWORD' => 'profilePasswordWrong',
          'SAME_PASSWORD' => 'profilePasswordSame',
          'TOO_MANY_ATTEMPTS' => 'profilePasswordTooMany',
          _ => 'authErrorGeneric',
        };
      }
    });
  }

  InputDecoration _decoration(String labelKey) => InputDecoration(
    labelText: ref.tr(labelKey),
    suffixIcon: IconButton(
      tooltip: ref.tr(_obscure ? 'profileShowPassword' : 'profileHidePassword'),
      icon: Icon(
        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
      ),
      onPressed: () => setState(() => _obscure = !_obscure),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(ref.tr('profileChangePasswordTitle'))),
      body: SafeArea(
        child: AutofillGroup(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                ref.tr('profileChangePasswordHint'),
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              TextField(
                key: const Key('currentPassword'),
                controller: _current,
                obscureText: _obscure,
                autofillHints: const [AutofillHints.password],
                textInputAction: TextInputAction.next,
                decoration: _decoration('profileCurrentPasswordLabel'),
              ),
              const SizedBox(height: 14),
              TextField(
                key: const Key('newPassword'),
                controller: _new,
                obscureText: _obscure,
                autofillHints: const [AutofillHints.newPassword],
                textInputAction: TextInputAction.next,
                decoration: _decoration('profileNewPasswordLabel')
                    .copyWith(helperText: ref.tr('profilePasswordRules')),
              ),
              const SizedBox(height: 14),
              TextField(
                key: const Key('confirmPassword'),
                controller: _confirm,
                obscureText: _obscure,
                autofillHints: const [AutofillHints.newPassword],
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _canSubmit ? _submit() : null,
                decoration: _decoration('profileConfirmPasswordLabel'),
              ),
              const SizedBox(height: 16),
              if (_errorKey != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    ref.tr(_errorKey!),
                    style: const TextStyle(color: AppColors.error),
                  ),
                ),
              if (_done)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.successTint,
                    borderRadius: BorderRadius.circular(10),
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
                          ref.tr('profilePasswordChanged'),
                          style: const TextStyle(color: AppColors.success),
                        ),
                      ),
                    ],
                  ),
                ),
              ElevatedButton(
                key: const Key('changePasswordSubmit'),
                onPressed: _canSubmit ? _submit : null,
                child: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(ref.tr('profileChangePasswordButton')),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const LegalDisclaimerFooter(),
    );
  }
}
