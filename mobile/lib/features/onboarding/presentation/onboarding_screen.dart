import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/tr.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';
import 'splash_screen.dart';

class _Step {
  const _Step({
    required this.icon,
    required this.titleKey,
    required this.bodyKey,
  });
  final IconData icon;
  final String titleKey;
  final String bodyKey;
}

const _steps = [
  _Step(
    icon: Icons.edit_note_rounded,
    titleKey: 'onboardTitle1',
    bodyKey: 'onboardBody1',
  ),
  _Step(
    icon: Icons.bolt_rounded,
    titleKey: 'onboardTitle2',
    bodyKey: 'onboardBody2',
  ),
  _Step(
    icon: Icons.fact_check_rounded,
    titleKey: 'onboardTitle3',
    bodyKey: 'onboardBody3',
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _page = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await markOnboardingSeen(ref.read(sharedPreferencesProvider));
    if (mounted) context.go('/calculator');
  }

  void _next() {
    if (_page == _steps.length - 1) {
      _finish();
      return;
    }
    _pageController.nextPage(
      duration: AppMotion.slow,
      curve: AppMotion.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _LanguagePicker(locale: locale),
                  TextButton(
                    onPressed: _finish,
                    child: Text(ref.tr('onboardSkip')),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _steps.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, index) => _OnboardStepView(
                  step: _steps[index],
                  active: index == _page,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 0, 28, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_steps.length, (i) {
                  final active = i == _page;
                  return AnimatedContainer(
                    duration: AppMotion.base,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : AppColors.border,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 28),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _next,
                  child: Text(
                    _page == _steps.length - 1
                        ? ref.tr('onboardStart')
                        : ref.tr('onboardNext'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardStepView extends ConsumerWidget {
  const _OnboardStepView({required this.step, required this.active});

  final _Step step;
  final bool active;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 36),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: active ? 0 : 1, end: active ? 1 : 0),
            duration: AppMotion.slow,
            curve: Curves.easeOutBack,
            builder: (context, value, child) =>
                Transform.scale(scale: 0.85 + 0.15 * value, child: child),
            child: Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(step.icon, size: 56, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 36),
          Text(
            ref.tr(step.titleKey),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            ref.tr(step.bodyKey),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguagePicker extends ConsumerWidget {
  const _LanguagePicker({required this.locale});

  final String locale;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: locale,
        icon: const Icon(
          Icons.expand_more_rounded,
          size: 18,
          color: AppColors.textSecondary,
        ),
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
        items: AppStrings.supportedLocales
            .map(
              (code) => DropdownMenuItem(
                value: code,
                child: Text(AppStrings.localeLabels[code]!),
              ),
            )
            .toList(),
        onChanged: (value) {
          if (value == null) return;
          ref.read(localeProvider.notifier).state = value;
          ref
              .read(sharedPreferencesProvider)
              .setString(localeStorageKey, value);
        },
      ),
    );
  }
}
