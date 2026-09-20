import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  passwordResetExpiresInMinutes: parseInt(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? '60',
    10,
  ),
  // Modo de prueba (solo sin SMTP): un codigo fijo permite restablecer contrasenas.
  passwordResetTestCode: process.env.PASSWORD_RESET_TEST_CODE ?? '',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'ÖstiTax <no-reply@xn--stitax-vxa.at>',
  },
}));
