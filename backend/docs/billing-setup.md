# Pagos — Stripe + PayPal

Integración server-side según `CLAUDE.md`: el estado **free/pro** solo se actualiza vía webhooks verificados.

## Endpoints

| Método | Ruta | Header | Descripción |
|--------|------|--------|-------------|
| `POST` | `/api/users/session` | — | Crea o recupera sesión por `deviceId` |
| `GET` | `/api/users/me` | `X-Device-Id` | Estado del usuario |
| `GET` | `/api/billing/status` | `X-Device-Id` | Plan, intentos, suscripción |
| `POST` | `/api/billing/stripe/checkout` | `X-Device-Id` | URL de Stripe Checkout |
| `POST` | `/api/billing/paypal/subscription` | `X-Device-Id` | URL de aprobación PayPal |
| `POST` | `/api/calculate` | `X-Device-Id` | Cálculo (descuenta intento si free) |
| `POST` | `/api/webhooks/stripe` | `stripe-signature` | Webhook Stripe |
| `POST` | `/api/webhooks/paypal` | headers PayPal | Webhook PayPal |

## Flujo cliente

1. `POST /api/users/session` → guardar `deviceId` en localStorage.
2. En cada petición enviar header `X-Device-Id: <uuid>`.
3. Al agotar intentos (402), abrir modal de pago:
   - Stripe: `POST /api/billing/stripe/checkout` → redirigir a `url`.
   - PayPal: `POST /api/billing/paypal/subscription` → redirigir a `approvalUrl`.
4. Tras pago, el webhook activa `plan: pro`. El cliente consulta `/api/billing/status`.

## Configuración Stripe

1. [Dashboard Stripe](https://dashboard.stripe.com) → Productos → crear suscripción mensual.
2. Copiar **Price ID** (`price_...`) → `STRIPE_PRICE_ID`.
3. Developers → API keys → `STRIPE_SECRET_KEY`.
4. Developers → Webhooks → endpoint `https://<tu-dominio>/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copiar signing secret → `STRIPE_WEBHOOK_SECRET`.

Local con [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Configuración PayPal

1. [PayPal Developer](https://developer.paypal.com) → App (Sandbox).
2. Subscriptions → crear **Plan** → copiar `P-...` → `PAYPAL_PLAN_ID`.
3. App credentials → `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`.
4. Webhooks → URL `https://<tu-dominio>/api/webhooks/paypal`
   - Eventos: `BILLING.SUBSCRIPTION.ACTIVATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`
   - Copiar Webhook ID → `PAYPAL_WEBHOOK_ID`.

Sandbox: `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`

## Variables (.env)

Ver `backend/.env.example`.

## Reglas de negocio

- **3 intentos gratuitos** por `deviceId` (configurable con `FREE_ATTEMPTS`).
- Solo `/api/calculate` descuenta intentos; cambiar idioma en el cliente no afecta.
- **Pro** solo si webhook confirma suscripción activa.
- Al cancelar suscripción → vuelta a `free` (sin resetear intentos usados).
