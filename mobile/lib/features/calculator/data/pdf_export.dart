import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';

/// Entrega el PDF al usuario (hoja de compartir de Android: guardar, enviar, imprimir).
typedef PdfSharer = Future<void> Function(Uint8List bytes, String filename);

/// Es un provider para poder sustituirlo en los tests: el plugin no funciona fuera de un móvil.
final pdfSharerProvider = Provider<PdfSharer>(
  (ref) =>
      (bytes, filename) => Printing.sharePdf(bytes: bytes, filename: filename),
);
