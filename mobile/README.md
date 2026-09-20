# ÖstiTax — app móvil (Flutter)

Cliente del mismo API que la web: no calcula impuestos localmente. Clean Architecture
(`domain` → `data` → `presentation`) con Riverpod.

## Desarrollo

Por defecto la app apunta al backend de producción (`https://ostitax-backend.onrender.com/api`).
Para usar el backend local desde el emulador de Android (10.0.2.2 es el localhost de la PC):

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

Comprobaciones antes de subir cambios:

```bash
flutter analyze
flutter test
```

Interruptores de funciones en `lib/core/config/feature_flags.dart`:

- `passwordResetEnabled`: "olvidé mi contraseña" (oculto hasta configurar SMTP en el backend).
- `bankingEnabled`: conexión bancaria GoCardless (oculta hasta activarla en el backend).

## Publicar en Google Play

ID de la app: `at.ostitax.app`. **Es permanente** una vez publicada.

### 1. Clave de subida (una sola vez)

```bash
keytool -genkey -v -keystore upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 \
  -validity 10000 -alias upload
```

Guarda el `.jks` **y** sus contraseñas fuera del repo (gestor de contraseñas + copia de
seguridad): si se pierden no se puede actualizar la app sin pasar por soporte de Google.

Crea `android/key.properties` (ignorado por git) con:

```properties
storePassword=<contraseña del almacén>
keyPassword=<contraseña de la clave>
keyAlias=upload
storeFile=<ruta absoluta al upload-keystore.jks>
```

Sin ese archivo, la build de release se firma con la clave de **debug** (sirve para probar en local,
pero Play Console la rechaza).

### 2. Versión

En `pubspec.yaml`, `version: 1.0.0+1`: la parte tras `+` es el `versionCode` y **debe subir en cada
envío** a Play.

### 3. Compilar el paquete

```bash
flutter build appbundle --release
```

Resultado: `build/app/outputs/bundle/release/app-release.aab`.

### 4. Ficha de Play Console

Recursos listos en `store/`: `icon-512.png` (icono) y `feature-graphic-1024x500.png` (gráfico
de funciones). Faltan las capturas de pantalla del móvil, la política de privacidad (URL pública),
el formulario de seguridad de los datos, la declaración de app financiera, la clasificación de
contenido y el enlace público para borrar la cuenta.

### Pendiente de decisión: cobros

Google Play exige **Google Play Billing** para suscripciones que desbloquean funciones digitales
dentro de la app. La app actual cobra con Stripe/PayPal abriendo el navegador, lo que puede
provocar el rechazo. Revisar la política de pagos vigente antes de enviar a producción.
