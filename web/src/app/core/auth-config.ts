/**
 * Client ID publico de Google OAuth (no es un secreto, es seguro exponerlo
 * en el bundle del frontend). Pegar el generado en Google Cloud Console.
 */
export const GOOGLE_CLIENT_ID = '';

/**
 * "Olvide mi contrasena" ya esta implementado (backend + esta UI) pero
 * oculto hasta que se configure un SMTP real en backend/.env, para no
 * mostrar un flujo que hoy no manda emails de verdad (solo los loguea en
 * la consola del backend). Cuando el SMTP este listo, cambiar a `true`
 * reactiva el link sin tocar nada mas.
 */
export const PASSWORD_RESET_ENABLED = false;
