/// "Olvide mi contrasena" ya esta implementado (backend + estas pantallas)
/// pero oculto hasta que se configure un SMTP real en backend/.env, para no
/// mostrar un flujo que hoy no manda emails de verdad (solo los loguea en
/// la consola del backend). Cuando el SMTP este listo, cambiar a `true`
/// reactiva el link sin tocar nada mas.
const bool passwordResetEnabled = false;

/// La conexion bancaria (GoCardless) esta implementada pero el backend la tiene desactivada
/// (GOCARDLESS_ENABLED=false). Oculta hasta activarla para no publicar una funcion rota.
const bool bankingEnabled = false;

/// Compras dentro de la app (Stripe/PayPal). Google Play exige Google Play Billing para las
/// suscripciones que desbloquean funciones digitales, asi que la build de Play sale sin pago:
/// ni boton "Pro", ni comparativa, ni hoja de pago. Quien ya es Pro (comprado en la web) entra
/// con su cuenta. Activar solo si se cambia a Google Play Billing o si la politica lo permite.
const bool purchasesEnabled = false;
