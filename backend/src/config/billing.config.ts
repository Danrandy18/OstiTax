import { registerAs } from '@nestjs/config';

export default registerAs('billing', () => ({
  freeAttempts: parseInt(process.env.FREE_ATTEMPTS ?? '3', 10),
  // Horas tras el primer intento gastado en las que se restauran los intentos gratis.
  freeAttemptsResetHours: parseInt(
    process.env.FREE_ATTEMPTS_RESET_HOURS ?? '24',
    10,
  ),
  appUrl: process.env.APP_URL ?? 'http://localhost:4200',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    priceIds: {
      individual_monthly: process.env.STRIPE_PRICE_ID_INDIVIDUAL_MONTHLY ?? '',
      individual_annual: process.env.STRIPE_PRICE_ID_INDIVIDUAL_ANNUAL ?? '',
      company_monthly: process.env.STRIPE_PRICE_ID_COMPANY_MONTHLY ?? '',
      company_annual: process.env.STRIPE_PRICE_ID_COMPANY_ANNUAL ?? '',
    },
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID ?? '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
    planIds: {
      individual_monthly: process.env.PAYPAL_PLAN_ID_INDIVIDUAL_MONTHLY ?? '',
      individual_annual: process.env.PAYPAL_PLAN_ID_INDIVIDUAL_ANNUAL ?? '',
      company_monthly: process.env.PAYPAL_PLAN_ID_COMPANY_MONTHLY ?? '',
      company_annual: process.env.PAYPAL_PLAN_ID_COMPANY_ANNUAL ?? '',
    },
    apiBase:
      process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com',
  },
}));
