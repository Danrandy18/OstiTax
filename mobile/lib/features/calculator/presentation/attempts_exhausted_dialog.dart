import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/tr.dart';
import '../../auth/presentation/auth_controller.dart';

/// Aviso cuando se agotan los intentos gratis y la app no vende suscripciones. No lleva a
/// ningun pago: solo informa de cuando vuelven y deja entrar a quien ya tiene Pro.
Future<void> showAttemptsExhaustedDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    builder: (dialogContext) =>
        _AttemptsExhaustedDialog(parentContext: context),
  );
}

class _AttemptsExhaustedDialog extends ConsumerWidget {
  const _AttemptsExhaustedDialog({required this.parentContext});

  final BuildContext parentContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(authControllerProvider).account != null;

    return AlertDialog(
      title: Text(ref.tr('attemptsExhaustedTitle')),
      content: Text(ref.tr('attemptsExhaustedBody')),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(ref.tr('close')),
        ),
        if (!loggedIn)
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              GoRouter.of(parentContext).push('/login');
            },
            child: Text(ref.tr('authLoginButton')),
          ),
      ],
    );
  }
}
