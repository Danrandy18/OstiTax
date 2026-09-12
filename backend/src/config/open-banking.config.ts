import { registerAs } from '@nestjs/config';

/**
 * GoCardless Bank Account Data (ex-Nordigen). A diferencia de FinanzOnline,
 * esto SI es autoservicio: registrarse gratis en bankaccountdata.gocardless.com
 * y crear un "user secret" (secret_id + secret_key).
 */
export default registerAs('openBanking', () => ({
  enabled: process.env.GOCARDLESS_ENABLED === 'true',
  secretId: process.env.GOCARDLESS_SECRET_ID ?? '',
  secretKey: process.env.GOCARDLESS_SECRET_KEY ?? '',
  baseUrl:
    process.env.GOCARDLESS_BASE_URL ??
    'https://bankaccountdata.gocardless.com/api/v2',
}));
