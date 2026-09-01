import { registerAs } from '@nestjs/config';

export default registerAs('billing', () => ({
  freeAttempts: parseInt(process.env.FREE_ATTEMPTS ?? '3', 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:4200',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? '',
      semiannual: process.env.STRIPE_PRICE_ID_SEMIANNUAL ?? '',
      annual: process.env.STRIPE_PRICE_ID_ANNUAL ?? '',
    },
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID ?? '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
    planIds: {
      monthly: process.env.PAYPAL_PLAN_ID_MONTHLY ?? '',
      semiannual: process.env.PAYPAL_PLAN_ID_SEMIANNUAL ?? '',
      annual: process.env.PAYPAL_PLAN_ID_ANNUAL ?? '',
    },
    apiBase:
      process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com',
  },
}));
