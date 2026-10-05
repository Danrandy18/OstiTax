/**
 * Client ID publico de Google OAuth (no es un secreto, es seguro exponerlo
 * en el bundle del frontend). Pegar el generado en Google Cloud Console.
 */
export const GOOGLE_CLIENT_ID = '';

// "Olvide mi contrasena" ya no es un interruptor aqui: el backend dice en GET /api/auth/config
// si el correo (Resend) esta configurado, y la web lo muestra solo entonces.
