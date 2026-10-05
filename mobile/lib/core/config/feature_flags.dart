// "Olvidé mi contraseña" ya no es un interruptor aquí: el backend dice en GET /api/auth/config
// si puede enviar el correo (Resend) y la app lo muestra solo entonces.

/// La conexion bancaria (GoCardless) esta implementada pero el backend la tiene desactivada
/// (GOCARDLESS_ENABLED=false). Oculta hasta activarla para no publicar una funcion rota.
const bool bankingEnabled = false;

/// Compras dentro de la app (Stripe/PayPal). Google Play exige Google Play Billing para las
/// suscripciones que desbloquean funciones digitales, asi que la build de Play sale sin pago:
/// ni boton "Pro", ni comparativa, ni hoja de pago. Quien ya es Pro (comprado en la web) entra
/// con su cuenta. Activar solo si se cambia a Google Play Billing o si la politica lo permite.
const bool purchasesEnabled = false;
