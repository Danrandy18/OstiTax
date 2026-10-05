import 'dart:typed_data';

import 'package:app_calculos/core/l10n/app_strings.dart';
import 'package:app_calculos/core/providers.dart';
import 'package:app_calculos/features/auth/data/auth_repository.dart';
import 'package:app_calculos/features/auth/domain/account_status.dart';
import 'package:app_calculos/features/auth/presentation/auth_controller.dart';
import 'package:app_calculos/features/calculator/data/pdf_export.dart';
import 'package:app_calculos/features/receipts/data/receipt_scanner.dart';
import 'package:app_calculos/features/receipts/data/receipts_repository.dart';
import 'package:app_calculos/features/receipts/domain/receipt_models.dart';
import 'package:app_calculos/features/receipts/presentation/receipt_review_form.dart';
import 'package:app_calculos/features/receipts/presentation/receipts_controller.dart';
import 'package:app_calculos/features/receipts/presentation/receipts_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeStorage implements FlutterSecureStorage {
  @override
  dynamic noSuchMethod(Invocation invocation) => Future<String?>.value(null);
}

class _FakeAuthRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

/// Sesion iniciada sin pasar por el backend.
class _SignedIn extends AuthController {
  _SignedIn({required bool isPro})
    : super(_FakeAuthRepository(), _FakeStorage()) {
    state = AuthState(
      account: AccountStatus(
        id: 'a-1',
        email: 'ana@example.com',
        name: null,
        plan: isPro ? 'pro' : 'free',
        isPro: isPro,
      ),
      token: 'token-1',
      ready: true,
    );
  }
}

/// Backend en memoria: devuelve lo mismo que el real para el ticket de ejemplo.
class _FakeReceiptsRepository implements ReceiptsRepository {
  _FakeReceiptsRepository(this.stored);

  final List<Receipt> stored;
  String? parsedText;
  ReceiptInput? created;
  int? exportedYear;
  bool exported = false;

  @override
  Future<ParsedReceipt> parse(String text, String token) async {
    parsedText = text;
    return ParsedReceipt.fromJson({
      'merchant': {'value': 'MediaMarkt Wien', 'evidence': 'MediaMarkt Wien'},
      'date': {'value': '2026-03-02', 'evidence': 'Datum 02.03.2026'},
      'total': {'value': 1299, 'evidence': 'Summe 1.299,00'},
      'vat': {
        'rate': 20,
        'amount': 216.5,
        'rates': [20],
        'evidence': 'USt 20%',
      },
      'documentNumber': {'value': 'MM-77', 'evidence': 'Beleg MM-77'},
      'category': 'workEquipment',
      'categoryEvidence': ['Laptop'],
      'depreciation': true,
      'gwgLimit': 1000,
      'warnings': <String>[],
    });
  }

  @override
  Future<List<Receipt>> list(String token) async => [...stored];

  @override
  Future<Receipt> create(ReceiptInput input, String token) async {
    created = input;
    final saved = Receipt(
      id: 'r-${stored.length + 1}',
      merchant: input.merchant,
      date: input.date,
      total: input.total,
      category: input.category,
      depreciation: (input.total ?? 0) > 1000,
      createdAt: '2026-10-05T00:00:00Z',
    );
    stored.add(saved);
    return saved;
  }

  @override
  Future<void> remove(String id, String token) async =>
      stored.removeWhere((r) => r.id == id);

  @override
  Future<void> removeAll(String token) async => stored.clear();

  @override
  Future<Uint8List> exportPdf(int? year, String token) async {
    exported = true;
    exportedYear = year;
    return Uint8List.fromList('%PDF-1.3'.codeUnits);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

const _ticket = 'MediaMarkt Wien\nLaptop 1.299,00\nSumme 1.299,00';

Future<_FakeReceiptsRepository> _pump(
  WidgetTester tester, {
  required bool isPro,
  List<Receipt> stored = const [],
  String locale = 'de',
  List<String>? sharedNames,
}) async {
  final repo = _FakeReceiptsRepository([...stored]);
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith((ref) => locale),
        authControllerProvider.overrideWith((ref) => _SignedIn(isPro: isPro)),
        receiptsRepositoryProvider.overrideWithValue(repo),
        receiptImagePickerProvider.overrideWithValue(
          ({required bool fromCamera}) async => 'fake.jpg',
        ),
        receiptTextReaderProvider.overrideWithValue((path) async => _ticket),
        pdfSharerProvider.overrideWithValue((bytes, name) async {
          sharedNames?.add(name);
        }),
      ],
      child: const MaterialApp(home: ReceiptsScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return repo;
}

String _de(String key) => AppStrings.t('de', key);

/// La lista se construye de forma perezosa: hay que desplazarse hasta el widget.
Future<void> _scrollTo(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(
    finder,
    200,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pumpAndSettle();
}

void main() {
  group('joinLinesByRow', () {
    test('une a la misma altura lo que ML Kit separa en bloques', () {
      final text = joinLinesByRow([
        (box: const Rect.fromLTWH(10, 10, 200, 20), text: 'MediaMarkt Wien'),
        (box: const Rect.fromLTWH(300, 102, 80, 20), text: '1.299,00'),
        (box: const Rect.fromLTWH(10, 100, 80, 20), text: 'Summe'),
        (box: const Rect.fromLTWH(10, 50, 120, 20), text: 'Laptop'),
        (box: const Rect.fromLTWH(300, 49, 80, 20), text: '1.299,00'),
      ]);
      expect(text, 'MediaMarkt Wien\nLaptop 1.299,00\nSumme 1.299,00');
    });

    test('no mezcla filas distintas aunque esten cerca', () {
      final text = joinLinesByRow([
        (box: const Rect.fromLTWH(0, 0, 50, 20), text: 'A'),
        (box: const Rect.fromLTWH(0, 22, 50, 20), text: 'B'),
      ]);
      expect(text, 'A\nB');
    });
  });

  group('modelos', () {
    test('parseAmount entiende el formato austriaco y el ingles', () {
      expect(parseAmount('1.299,00'), 1299);
      expect(parseAmount('27,9'), 27.9);
      expect(parseAmount('27.90 €'), 27.9);
      expect(parseAmount(''), isNull);
      expect(parseAmount('abc'), isNull);
      expect(parseAmount('-5'), isNull);
    });

    test('totales por ano en centimos, el mas reciente primero', () {
      Receipt r(String id, String? date, double total) => Receipt(
        id: id,
        merchant: '',
        date: date,
        total: total,
        category: 'other',
        depreciation: false,
        createdAt: '2024-01-01T00:00:00Z',
      );
      expect(
        totalsByYear([
          r('1', '2025-01-01', 0.1),
          r('2', '2026-01-01', 0.2),
          r('3', '2026-02-01', 0.1),
          r('4', null, 5),
        ]),
        [('2026', 0.3), ('2025', 0.1), ('2024', 5.0)],
      );
    });

    test('el recibo se envia sin imagen ni texto del OCR', () {
      const input = ReceiptInput(
        merchant: 'Libro',
        date: '2026-01-01',
        total: 12.5,
        vatRate: 20,
        vatAmount: 2.08,
        documentNumber: '',
        category: 'other',
      );
      expect(input.toJson().keys, {
        'merchant',
        'date',
        'total',
        'vatRate',
        'vatAmount',
        'documentNumber',
        'category',
      });
    });
  });

  test('las claves de recibos estan traducidas en los 6 idiomas', () {
    final keys = [
      'receiptsTitle',
      'receiptsNavLink',
      'receiptsPrivacy',
      'receiptsCamera',
      'receiptsChooseFile',
      'receiptsSave',
      'receiptsExportPdf',
      'receiptsRemoveConfirm',
      'receiptsCat_workEquipment',
      'receiptsWarn_vat_mixed_rates',
    ];
    for (final locale in AppStrings.supportedLocales) {
      for (final key in keys) {
        final value = AppStrings.t(locale, key);
        expect(value, isNot(key), reason: 'Falta "$key" en "$locale"');
        if (locale != 'de') {
          expect(
            value,
            isNot(_de(key)),
            reason: '"$key" en "$locale" es el aleman de respaldo',
          );
        }
      }
    }
  });

  testWidgets('Pro: foto -> revision -> guardado en la cuenta', (tester) async {
    final repo = await _pump(tester, isPro: true);
    expect(find.text(_de('receiptsEmpty')), findsOneWidget);

    await tester.tap(find.byKey(const Key('receiptsCamera')));
    await tester.pumpAndSettle();

    // Al backend solo llega el texto reconocido en el movil.
    expect(repo.parsedText, _ticket);
    expect(find.text(_de('receiptsReviewTitle')), findsOneWidget);
    expect(find.text(_de('receiptsGwgWarning')), findsOneWidget);
    expect(find.textContaining('Summe 1.299,00'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('receiptTotal')), '899,90');
    await tester.pump();
    expect(find.text(_de('receiptsGwgWarning')), findsNothing);

    await _scrollTo(tester, find.byKey(const Key('receiptSave')));
    await tester.tap(find.byKey(const Key('receiptSave')));
    await tester.pumpAndSettle();

    expect(repo.created!.merchant, 'MediaMarkt Wien');
    expect(repo.created!.total, 899.9);
    expect(repo.created!.date, '2026-03-02');
    expect(repo.created!.vatRate, 20);
    expect(repo.created!.category, 'workEquipment');
    expect(find.text('MediaMarkt Wien'), findsOneWidget);
    expect(find.textContaining('899,90'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('exporta el PDF del ano elegido y borra con confirmacion', (
    tester,
  ) async {
    final names = <String>[];
    final repo = await _pump(
      tester,
      isPro: true,
      sharedNames: names,
      stored: const [
        Receipt(
          id: 'r-1',
          merchant: 'ÖBB',
          date: '2026-06-21',
          total: 27.9,
          category: 'travel',
          depreciation: false,
          createdAt: '2026-06-21T00:00:00Z',
        ),
      ],
    );

    await _scrollTo(tester, find.byKey(const Key('receiptsExportPdf')));
    await tester.tap(find.byKey(const Key('receiptsExportPdf')));
    await tester.pumpAndSettle();
    expect(repo.exportedYear, 2026);
    expect(names, ['OestiTax-Belege-2026.pdf']);

    await tester.tap(find.byIcon(Icons.delete_outline_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, _de('receiptsRemove')));
    await tester.pumpAndSettle();
    expect(repo.stored, isEmpty);
    expect(find.text(_de('receiptsEmpty')), findsOneWidget);
  });

  testWidgets('sin Pro: no escanea ni vende, pero ve y exporta lo guardado', (
    tester,
  ) async {
    await _pump(
      tester,
      isPro: false,
      stored: const [
        Receipt(
          id: 'r-1',
          merchant: 'Libro',
          date: '2025-12-01',
          total: 12.5,
          category: 'other',
          depreciation: false,
          createdAt: '2025-12-01T00:00:00Z',
        ),
      ],
    );

    expect(find.text(_de('receiptsProRequired')), findsOneWidget);
    expect(find.text(_de('receiptsProExpired')), findsOneWidget);
    expect(find.byKey(const Key('receiptsCamera')), findsNothing);
    // La build de Play no vende nada dentro de la app.
    expect(find.text(_de('receiptsUpgrade')), findsNothing);
    expect(find.text('Libro'), findsOneWidget);
    expect(find.byKey(const Key('receiptsExportPdf')), findsOneWidget);
  });

  for (final locale in AppStrings.supportedLocales) {
    testWidgets('la pantalla cabe en 360 px ("$locale")', (tester) async {
      await _pump(
        tester,
        isPro: true,
        locale: locale,
        stored: const [
          Receipt(
            id: 'r-1',
            merchant: 'Bäckerei Ströck Wien Hauptbahnhof Filiale 12',
            date: '2026-02-03',
            total: 1234.56,
            category: 'homeServices',
            depreciation: false,
            createdAt: '2026-02-03T00:00:00Z',
          ),
        ],
      );
      await tester.tap(find.byKey(const Key('receiptsCamera')));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  }

  test('el controlador no llama al backend sin sesion', () async {
    final repo = _FakeReceiptsRepository([]);
    final controller = ReceiptsController(repo, null);
    await controller.load();
    expect(controller.state.loaded, isFalse);
  });
}
