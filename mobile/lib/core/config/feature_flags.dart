/// "Olvide mi contrasena" ya esta implementado (backend + estas pantallas)
/// pero oculto hasta que se configure un SMTP real en backend/.env, para no
/// mostrar un flujo que hoy no manda emails de verdad (solo los loguea en
/// la consola del backend). Cuando el SMTP este listo, cambiar a `true`
/// reactiva el link sin tocar nada mas.
const bool passwordResetEnabled = false;
