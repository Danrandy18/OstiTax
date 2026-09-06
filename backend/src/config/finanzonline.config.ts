import { registerAs } from '@nestjs/config';

/**
 * FinanzOnline (BMF) no tiene un registro de autoservicio como Stripe/PayPal:
 * requiere certificacion oficial como transmisor de datos autorizado. Ver
 * README para el proceso. `enabled` queda en false hasta tener credenciales
 * reales aprobadas por el BMF.
 */
export default registerAs('finanzonline', () => ({
  enabled: process.env.FINANZONLINE_ENABLED === 'true',
  webserviceUrl: process.env.FINANZONLINE_WEBSERVICE_URL ?? '',
  teilnehmerId: process.env.FINANZONLINE_TEILNEHMER_ID ?? '',
  benutzerId: process.env.FINANZONLINE_BENUTZER_ID ?? '',
  pin: process.env.FINANZONLINE_PIN ?? '',
}));
