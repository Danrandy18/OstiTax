import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/animated_logo.dart';
import '../../session/presentation/session_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _proceed());
  }

  Future<void> _proceed() async {
    // Deja ver la animación de marca y a la vez espera la sesión del backend.
    final minimumDisplay = Future<void>.delayed(
      const Duration(milliseconds: 1400),
    );
    await Future.wait([minimumDisplay, _waitForSessionReady()]);
    if (!mounted) return;

    final prefs = ref.read(sharedPreferencesProvider);
    final seenOnboarding = prefs.getBool(onboardingSeenKey) ?? false;
    context.go(seenOnboarding ? '/calculator' : '/onboarding');
  }

  Future<void> _waitForSessionReady() async {
    while (mounted && !ref.read(sessionControllerProvider).ready) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AnimatedLogo(size: 96),
            const SizedBox(height: 22),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 700),
              curve: const Interval(0.3, 1, curve: Curves.easeOut),
              builder: (context, value, child) =>
                  Opacity(opacity: value, child: child),
              child: const Text(
                'ÖstiTax',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Marca el onboarding como visto (usado por OnboardingScreen).
Future<void> markOnboardingSeen(SharedPreferences prefs) =>
    prefs.setBool(onboardingSeenKey, true);
