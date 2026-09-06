import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

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
const clientId = env.PAYPAL_CLIENT_ID;
const clientSecret = env.PAYPAL_CLIENT_SECRET;
const apiBase = env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

if (!clientId || !clientSecret) {
  console.error(
    'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no estan configuradas en backend/.env.',
  );
  process.exit(1);
}

const PLANS = [
  {
    envKey: 'PAYPAL_PLAN_ID_INDIVIDUAL_MONTHLY',
    name: 'OestiTax Pro Individual Mensual',
    price: '3.99',
    intervalUnit: 'MONTH',
  },
  {
    envKey: 'PAYPAL_PLAN_ID_INDIVIDUAL_ANNUAL',
    name: 'OestiTax Pro Individual Anual',
    price: '39.99',
    intervalUnit: 'YEAR',
  },
  {
    envKey: 'PAYPAL_PLAN_ID_COMPANY_MONTHLY',
    name: 'OestiTax Pro Empresa Mensual',
    price: '12.99',
    intervalUnit: 'MONTH',
  },
  {
    envKey: 'PAYPAL_PLAN_ID_COMPANY_ANNUAL',
    name: 'OestiTax Pro Empresa Anual',
    price: '129.99',
    intervalUnit: 'YEAR',
  },
];

async function getAccessToken() {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`OAuth error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function request(token, path, body) {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `PayPal API error (${response.status}) en ${path}: ${await response.text()}`,
    );
  }

  return response.json();
}

async function getOrCreateProductId(token) {
  const listRes = await fetch(`${apiBase}/v1/billing/plans?page_size=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const { plans } = await listRes.json();
    if (plans?.[0]?.product_id) {
      console.log(`Reutilizando producto existente: ${plans[0].product_id}`);
      return plans[0].product_id;
    }
  }

  const product = await request(token, '/v1/catalog/products', {
    name: 'OestiTax Pro',
    description: 'Suscripcion Pro de la calculadora fiscal OestiTax',
    type: 'SERVICE',
    category: 'SOFTWARE',
  });
  console.log(`Producto creado: ${product.id}`);
  return product.id;
}

async function main() {
  const token = await getAccessToken();
  const productId = await getOrCreateProductId(token);

  let envContent = readFileSync(envPath, 'utf8');

  for (const planDef of PLANS) {
    const plan = await request(token, '/v1/billing/plans', {
      product_id: productId,
      name: planDef.name,
      billing_cycles: [
        {
          frequency: {
            interval_unit: planDef.intervalUnit,
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: planDef.price, currency_code: 'EUR' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 2,
      },
    });
    console.log(`${planDef.name}: ${plan.id}`);

    const pattern = new RegExp(`^${planDef.envKey}=.*$`, 'm');
    envContent = pattern.test(envContent)
      ? envContent.replace(pattern, `${planDef.envKey}=${plan.id}`)
      : `${envContent.trimEnd()}\n${planDef.envKey}=${plan.id}\n`;
  }

  writeFileSync(envPath, envContent);
  console.log('backend/.env actualizado con los 4 Plan IDs de PayPal.');
}

main().catch((error) => {
  console.error('Error creando planes de PayPal:', error.message);
  process.exit(1);
});
