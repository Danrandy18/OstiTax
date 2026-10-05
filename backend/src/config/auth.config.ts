import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  passwordResetExpiresInMinutes: parseInt(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? '60',
    10,
  ),
  // Modo de prueba (solo sin correo configurado): un codigo fijo permite restablecer contrasenas.
  passwordResetTestCode: process.env.PASSWORD_RESET_TEST_CODE ?? '',
  // Correo con Resend: basta la clave y un remitente de un dominio verificado en Resend.
  mail: {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    // Remitente de nuestro dominio (Resend no envia desde @gmail.com); las respuestas de los
    // usuarios llegan al buzon de soporte.
    from: process.env.MAIL_FROM || 'ÖstiTax <info@xn--stitax-vxa.at>',
    replyTo: process.env.MAIL_REPLY_TO || 'korevan.software@gmail.com',
  },
}));
