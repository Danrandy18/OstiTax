# ML Kit: el plugin google_mlkit_text_recognition compila contra los modelos chino, devanagari,
# japones y coreano (compileOnly), pero la app solo incluye el latino (recibos austriacos).
# Sin estas reglas R8 falla por clases que no se usan nunca.
-dontwarn com.google.mlkit.vision.text.chinese.**
-dontwarn com.google.mlkit.vision.text.devanagari.**
-dontwarn com.google.mlkit.vision.text.japanese.**
-dontwarn com.google.mlkit.vision.text.korean.**
