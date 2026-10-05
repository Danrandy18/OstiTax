import 'dart:ui' show Rect;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

/// Toma la foto (camara o galeria) y devuelve la ruta local, o null si se cancela.
typedef ReceiptImagePicker = Future<String?> Function({
  required bool fromCamera,
});

/// Reconoce el texto de la foto en el propio telefono (ML Kit, sin internet).
typedef ReceiptTextReader = Future<String> Function(String imagePath);

/// Providers para poder sustituirlos en los tests: los plugins solo funcionan en un movil.
final receiptImagePickerProvider = Provider<ReceiptImagePicker>(
  (ref) => ({required bool fromCamera}) async {
    final file = await ImagePicker().pickImage(
      source: fromCamera ? ImageSource.camera : ImageSource.gallery,
      // Suficiente para leer un ticket y bastante mas rapido de procesar.
      maxWidth: 2000,
      maxHeight: 2000,
      imageQuality: 90,
    );
    return file?.path;
  },
);

final receiptTextReaderProvider = Provider<ReceiptTextReader>(
  (ref) => (imagePath) async {
    // Los recibos austriacos usan alfabeto latino: basta el modelo latino incluido en la app.
    final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      final result = await recognizer.processImage(
        InputImage.fromFilePath(imagePath),
      );
      return joinLinesByRow([
        for (final block in result.blocks)
          for (final line in block.lines)
            (box: line.boundingBox, text: line.text),
      ]);
    } finally {
      await recognizer.close();
    }
  },
);

/// ML Kit agrupa el texto en bloques: en un ticket, "Summe" (izquierda) y "27,90" (derecha)
/// suelen salir en bloques distintos. El analizador del backend lee linea a linea, asi que se
/// reconstruyen las filas del papel: lineas a la misma altura se unen de izquierda a derecha.
String joinLinesByRow(List<({Rect box, String text})> lines) {
  final sorted = [...lines]
    ..sort((a, b) => a.box.center.dy.compareTo(b.box.center.dy));
  final rows = <List<({Rect box, String text})>>[];
  for (final line in sorted) {
    final row = rows.isEmpty ? null : rows.last;
    // Misma fila si el centro vertical cae dentro de la mitad de la altura de la fila.
    if (row != null &&
        (line.box.center.dy - row.first.box.center.dy).abs() <
            row.first.box.height / 2) {
      row.add(line);
    } else {
      rows.add([line]);
    }
  }
  return [
    for (final row in rows)
      ([...row]..sort((a, b) => a.box.left.compareTo(b.box.left)))
          .map((l) => l.text.trim())
          .where((t) => t.isNotEmpty)
          .join(' '),
  ].where((row) => row.isNotEmpty).join('\n');
}
