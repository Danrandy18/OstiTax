import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Stripe from 'stripe';

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const envPath = path.join(backendRoot, '.env');

function loadEnv(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv(envPath);
const secretKey = env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error(
    'STRIPE_SECRET_KEY no esta configurada en backend/.env. Pega tu clave sk_test_... y vuelve a ejecutar este script.',
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const PLANS = [
  {
    envKey: 'STRIPE_PRICE_ID_MONTHLY',
    name: 'OestiTax Pro Mensual',
    unitAmount: 300,
    recurring: { interval: 'month', interval_count: 1 },
  },
  {
    envKey: 'STRIPE_PRICE_ID_SEMIANNUAL',
    name: 'OestiTax Pro Semestral',
    unitAmount: 1500,
    recurring: { interval: 'month', interval_count: 6 },
  },
  {
    envKey: 'STRIPE_PRICE_ID_ANNUAL',
    name: 'OestiTax Pro Anual',
    unitAmount: 2500,
    recurring: { interval: 'year', interval_count: 1 },
  },
];

async function main() {
  const product = await stripe.products.create({
    name: 'OestiTax Pro',
    description: 'Suscripcion Pro de la calculadora fiscal OestiTax',
  });
  console.log(`Producto creado: ${product.id}`);

  let envContent = readFileSync(envPath, 'utf8');

  for (const plan of PLANS) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: plan.unitAmount,
      recurring: plan.recurring,
      nickname: plan.name,
    });
    console.log(`${plan.name}: ${price.id}`);

    const pattern = new RegExp(`^${plan.envKey}=.*$`, 'm');
    envContent = pattern.test(envContent)
      ? envContent.replace(pattern, `${plan.envKey}=${price.id}`)
      : `${envContent.trimEnd()}\n${plan.envKey}=${price.id}\n`;
  }

  writeFileSync(envPath, envContent);
  console.log('backend/.env actualizado con los 3 Price IDs de Stripe.');
}

main().catch((error) => {
  console.error('Error creando planes de Stripe:', error.message);
  process.exit(1);
});
