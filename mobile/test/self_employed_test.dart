import 'package:app_calculos/core/l10n/app_strings.dart';
import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/calculator/data/calculation_pdf.dart';
import 'package:app_calculos/features/calculator/data/calculator_repository.dart';
import 'package:app_calculos/features/calculator/domain/calculation_models.dart';
import 'package:app_calculos/features/calculator/presentation/calculator_screen.dart';
import 'package:app_calculos/features/session/data/session_repository.dart';
import 'package:app_calculos/features/session/domain/user_status.dart';
import 'package:app_calculos/features/session/presentation/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeStorage implements FlutterSecureStorage {
  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

class _FakeAuthRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class _FakeSessionRepository implements SessionRepository {
  @override
  Future<UserStatus> createSession(String? deviceId) async => const UserStatus(
    deviceId: 'device-1',
    plan: 'pro',
    freeAttemptsRemaining: 3,
    isPro: true,
  );

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

/// Respuesta real del backend para 40.000 € de beneficio, Gewerbe, primeros años.
final _seJson = <String, dynamic>{
  'tableYear': 2026,
  'recurring': {
    'gross': 3333.33,
    'socialInsurance': 907.29,
    'incomeTax': 209.72,
    'net': 2216.32,
  },
  'thirteenth': {'gross': 0, 'socialInsurance': 0, 'incomeTax': 0, 'net': 0},
  'fourteenth': {'gross': 0, 'socialInsurance': 0, 'incomeTax': 0, 'net': 0},
  'annual': {
    'gross': 40000,
    'socialInsurance': 10887.52,
    'incomeTax': 2516.68,
    'net': 26595.8,
  },
  'selfEmployed': {
    'annualProfit': 40000,
    'contributionBase': 40000,
    'insured': true,
    'minimumBaseApplied': false,
    'maximumBaseApplied': false,
    'pension': 7400,
    'health': 2720,
    'provision': 612,
    'accident': 155.52,
    'socialInsurance': 10887.52,
    'profitAfterSocialInsurance': 29112.48,
    'gewinnfreibetrag': 4366.87,
    'taxableIncome': 24745.61,
    'tariffTax': 2516.68,
    'familyBonus': 0,
    'soleEarnerCredit': 0,
    'incomeTax': 2516.68,
    'net': 26595.8,
    'quarterlyTaxPrepayment': 629.17,
    'quarterlySocialInsurance': 482.46,
    'provisionalSocialInsurance': 1929.84,
    'estimatedBackPayment': 8957.68,
  },
};

class _FakeCalculatorRepository implements CalculatorRepository {
  CalculateRequest? lastRequest;

  @override
  Future<CalculateResponse> calculate(
    CalculateRequest request, {
    required String? deviceId,
    String? authToken,
  }) async {
    lastRequest = request;
    return CalculateResponse.fromJson(_seJson);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

Future<_FakeCalculatorRepository> _pump(
  WidgetTester tester, {
  String locale = 'de',
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final repo = _FakeCalculatorRepository();
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith((ref) => locale),
        authControllerProvider.overrideWith(
          (ref) => AuthController(_FakeAuthRepository(), _FakeStorage()),
        ),
        sessionControllerProvider.overrideWith(
          (ref) => SessionController(_FakeSessionRepository(), prefs),
        ),
        calculatorRepositoryProvider.overrideWithValue(repo),
      ],
      child: const MaterialApp(home: CalculatorScreen()),
    ),
  );
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 400));
  }
  return repo;
}

String _t(String locale, String key) => AppStrings.t(locale, key);

Future<void> _scrollTo(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(
    finder,
    250,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pump(const Duration(milliseconds: 400));
}

void main() {
  testWidgets(
    'autonomo: oculta los campos de nomina y muestra el desglose anual',
    (tester) async {
      final repo = await _pump(tester);
      await tester.tap(find.text(_t('de', 'employmentSelfEmployed')));
      await tester.pump(const Duration(milliseconds: 400));

      // Cambia a beneficio anual y oculta Bundesland, Sachbezug y Pendlerpauschale.
      expect(find.text(_t('de', 'profitAmountYearly')), findsOneWidget);
      expect(find.text(_t('de', 'selfEmployedKind')), findsOneWidget);
      expect(find.text(_t('de', 'state')), findsNothing);
      expect(find.text(_t('de', 'benefitInKind')), findsNothing);
      expect(find.text(_t('de', 'commute')), findsNothing);

      final calculate = find.text(_t('de', 'calculate'));
      await _scrollTo(tester, calculate);
      await tester.tap(calculate);
      for (var i = 0; i < 6; i++) {
        await tester.pump(const Duration(milliseconds: 400));
      }

      expect(repo.lastRequest!.isSelfEmployed, isTrue);
      expect(repo.lastRequest!.grossAmount, 40000);
      expect(repo.lastRequest!.incomePeriod, IncomePeriod.yearly);
      expect(repo.lastRequest!.toJson()['selfEmployedKind'], 'trade');

      // Sin pestañas de 13./14. Bezug.
      expect(find.text(_t('de', 'seMonthlyAverage')), findsOneWidget);
      expect(find.text(_t('de', 'thirteenth')), findsNothing);

      await _scrollTo(tester, find.byKey(const Key('selfEmployedBackPayment')));
      expect(find.text(_t('de', 'seGewinnfreibetrag')), findsOneWidget);
      expect(find.textContaining('8.957,68'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  for (final locale in AppStrings.supportedLocales) {
    testWidgets('el formulario de autonomo cabe en 360 px ("$locale")', (
      tester,
    ) async {
      await _pump(tester, locale: locale);
      await tester.tap(find.text(_t(locale, 'employmentSelfEmployed')));
      await tester.pump(const Duration(milliseconds: 400));
      expect(tester.takeException(), isNull);
      if (locale != 'de') {
        expect(_t(locale, 'seBackPayment'), isNot(_t('de', 'seBackPayment')));
      }
    });
  }

  group('PDF de autonomos (siempre en alemán)', () {
    TestWidgetsFlutterBinding.ensureInitialized();
    const request = CalculateRequest(
      employmentType: EmploymentType.selfEmployed,
      grossAmount: 40000,
      incomePeriod: IncomePeriod.yearly,
      selfEmployedFirstYears: true,
    );

    test('filas de entrada propias del autonomo', () {
      final rows = pdfInputRows(request);
      final labels = rows.map((r) => r.$1).toList();
      expect(rows.first.$2, 'Selbstständig');
      expect(labels, contains('Jahresgewinn vor SV'));
      expect(labels, contains('Art der Tätigkeit'));
      expect(labels, isNot(contains('Bruttobezug')));
      expect(labels, isNot(contains('Arbeitsort (Bundesland)')));
    });

    for (final tier in PdfTier.values) {
      testWidgets('genera un PDF valido ($tier)', (tester) async {
        final bytes = await tester.runAsync(
          () => buildCalculationPdf(
            request: request,
            response: CalculateResponse.fromJson(_seJson),
            tier: tier,
          ),
        );
        expect(String.fromCharCodes(bytes!.take(5)), '%PDF-');
      });
    }
  });
}
