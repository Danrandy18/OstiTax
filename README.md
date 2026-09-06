# App Cálculos

Monorepo con frontend web (Angular), backend API (NestJS + PostgreSQL) y app móvil (Flutter).

## Estructura

```
app_calculos/
├── web/                 # Angular 21 (frontend)
├── backend/             # NestJS 11 (API REST)
├── mobile/              # Flutter (app móvil)
├── docker-compose.yml   # PostgreSQL local
└── tools/flutter/       # SDK Flutter local (no commitear)
```

## Requisitos

| Herramienta | Versión usada |
|-------------|---------------|
| Node.js     | 22.x          |
| npm         | 11.x          |
| Angular CLI | 21.x          |
| NestJS CLI  | 11.x          |
| Docker      | Para PostgreSQL |
| Flutter     | SDK en `tools/flutter` o instalación global |

> **Nota:** Angular 22 requiere Node `>= 22.22.3`. Con Node 22.15 se usa Angular 21 (última compatible).

## Inicio rápido

### 1. Base de datos (PostgreSQL)

```bash
docker compose up -d
```

Credenciales por defecto (ver `backend/.env.example`):

- Host: `localhost:5432`
- Usuario: `app_calculos`
- Contraseña: `app_calculos`
- Base de datos: `app_calculos`

### 2. Backend (NestJS)

```bash
cd backend
cp .env.example .env   # si aún no existe
npm run start:dev
```

API disponible en `http://localhost:3000/api`

### 3. Web (Angular)

```bash
cd web
npm start
```

App en `http://localhost:4200` con proxy a la API en `/api`.

### 4. Mobile (Flutter)

Con Flutter global en PATH:

```bash
cd mobile
flutter run
```

Con el SDK local del proyecto:

```powershell
$env:Path = "c:\Users\ronau\Desktop\proyectos\app_calculos\tools\flutter\bin;" + $env:Path
cd mobile
flutter run
```

## Puertos

| Servicio   | Puerto |
|------------|--------|
| PostgreSQL | 5432   |
| Backend    | 3000   |
| Web        | 4200   |

## Configurar pagos (Stripe y PayPal)

La app cobra la suscripción Pro con dos pasarelas: **Stripe** (tarjeta) y **PayPal**. Todas las credenciales van en `backend/.env` (nunca se suben a git). Sin esto configurado, los botones de pago fallan con un error de "no configurado", pero el resto de la app (calculadora, cuentas, login) funciona igual.

Los planes actuales son 4 combinaciones de precio, siempre en EUR:

| Segmento | Mensual | Anual |
|---|---|---|
| Empleados / estudiantes | 3,99 € | 39,99 € |
| Empresas | 12,99 € | 129,99 € |

### Stripe

1. Crea una cuenta en [dashboard.stripe.com](https://dashboard.stripe.com) (o usa la del cliente).
2. Arriba a la derecha del dashboard hay un switch **Test mode / Live mode**. Para probar, quédate en modo Test; para cobrar de verdad, actívalo en modo Live (ver más abajo).
3. Ve a **Developers → API keys** y copia la **Secret key** (empieza con `sk_test_...` en test, `sk_live_...` en live).
4. Pégala en `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
5. Genera los 4 precios automáticamente (ya están definidos en `backend/scripts/setup-stripe-plans.mjs` con los importes de la tabla de arriba):
   ```bash
   cd backend
   npm run setup:stripe-plans
   ```
   Esto crea el producto y los 4 `price_...` en tu cuenta de Stripe y **los escribe solo en `backend/.env`** (`STRIPE_PRICE_ID_INDIVIDUAL_MONTHLY`, etc.). No hace falta copiarlos a mano.
6. Configura el webhook para que Stripe le avise al backend cuando se completa un pago:
   - **Developers → Webhooks → Add endpoint**
   - URL: `https://tu-dominio.com/api/webhooks/stripe` (tiene que ser una URL pública con HTTPS; en local no funciona sin un túnel como `ngrok`/`localtunnel`)
   - Eventos a escuchar: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copia el **Signing secret** que te muestra (`whsec_...`) y pégalo en `backend/.env`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

### PayPal

1. Entra a [developer.paypal.com](https://developer.paypal.com) con la cuenta de PayPal del cliente (o una propia) e inicia sesión.
2. Arriba hay un switch **Sandbox / Live**. Para probar, usa Sandbox; para cobrar de verdad, cambia a Live (ver más abajo).
3. Ve a **Apps & Credentials → Create App**. Copia el **Client ID** y el **Secret**:
   ```
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   ```
4. **Importante:** en la página de esa app, baja hasta **Features** y marca la casilla **Subscriptions**. Sin esto, la creación de planes falla.
5. Genera los 4 planes automáticamente (usa las credenciales que acabas de pegar en `.env`):
   ```bash
   cd backend
   npm run setup:paypal-plans
   ```
   Esto crea el producto y los 4 `P-...` y los escribe solo en `backend/.env` (`PAYPAL_PLAN_ID_INDIVIDUAL_MONTHLY`, etc.).
6. Configura el webhook (puedes hacerlo por API o por el dashboard en **Apps & Credentials → tu app → Add Webhook**):
   - URL: `https://tu-dominio.com/api/webhooks/paypal` (misma limitación de HTTPS público que Stripe)
   - Eventos: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.RE-ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.SUSPENDED`
   - Copia el **Webhook ID** y pégalo:
     ```
     PAYPAL_WEBHOOK_ID=...
     ```
7. Confirma que `PAYPAL_API_BASE` apunte al entorno correcto:
   ```
   # Sandbox (pruebas):
   PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
   # Live (cobros reales):
   PAYPAL_API_BASE=https://api-m.paypal.com
   ```

### Pasar de pruebas a cobros reales (checklist)

Los Price ID / Plan ID de test **no sirven** en modo live — hay que generarlos de nuevo:

1. En Stripe: activa **Live mode**, repite los pasos 3-6 con la Secret key y el webhook de Live.
2. En PayPal: crea una app en modo **Live**, repite los pasos 3-6 con esas credenciales.
3. Cambia `APP_URL` en `backend/.env` a la URL real del sitio en producción (se usa para las páginas de éxito/cancelación del pago).
4. Vuelve a correr `npm run setup:stripe-plans` y `npm run setup:paypal-plans` con las credenciales live.

### Probar sin dominio público (desarrollo local)

Los webhooks de Stripe y PayPal necesitan una URL alcanzable desde internet. Para probar en tu máquina:

- **Stripe** tiene su propia CLI oficial para esto: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (te da un `whsec_...` de prueba al vuelo).
- **PayPal** no tiene un equivalente oficial; se puede usar un túnel genérico como `npx localtunnel --port 3000` y registrar esa URL temporal como webhook.

## Próximos pasos sugeridos

- Configurar credenciales reales de Stripe y PayPal (ver sección anterior)
- Configurar SMTP para activar "olvidé mi contraseña" (ver `backend/.env.example`)
- Configurar un OAuth Client ID de Google para activar "Sign in with Google"
- Introducir migraciones de base de datos para despliegues en producción (hoy usa `synchronize: true` en desarrollo)

## Integración Claude + Cursor (MCP de terceros)

Servidores configurados en `.cursor/mcp.json`. **No son oficiales de Anthropic:**

- **`skills-mcp`** — npm [skills-mcp](https://github.com/agustinustheo/skills-mcp); expone la carpeta `skills/`
- **`claude-api`** — MCP local en `tools/claude-api-mcp/`; llama a la API de Anthropic
- **`playwright`** — npm `@playwright/mcp`; navegador headless
- **`agent-browser`** — CLI global; navegador real para que el agente testee la UI ([repo](https://github.com/vercel-labs/agent-browser))

### Configuración MCP

1. Instalar CLI (una vez en la máquina):
   ```powershell
   npm install -g agent-browser@latest
   agent-browser install
   ```
2. Define `ANTHROPIC_API_KEY` (solo para `claude-api`; ver `.env.example`)
3. Reinicia Cursor
4. Activa `skills-mcp`, `claude-api`, `playwright` y `agent-browser` en **Settings → Tools & MCP**

### E2E en `web/` (Playwright)

```bash
cd web
npm run e2e        # tests headless
npm run e2e:ui     # interfaz interactiva
npm run e2e:report # ver último informe HTML
```

### Skills (`skills/`)

| Skill | Origen | Uso |
|-------|--------|-----|
| `skill-creator` | Anthropic | Crear skills |
| `mcp-builder` | Anthropic | Servidores MCP |
| `frontend-design` | Anthropic | Diseño UI genérico |
| `frontend-style` | **Proyecto** | Estándares UI de este producto |
| `web-design-guidelines` | Vercel Labs | Auditoría UI (accesibilidad, layout, forms) |
| `find-skills` | Vercel Labs | Buscar e instalar skills ([skills.sh](https://skills.sh)) |
| `agent-browser` | Vercel Labs | Automatización navegador para el agente |
| `awesome-design` | TypeUI | Design system Clean (awesome-design-skills) |
| `taste-skill` | Comunidad | Diseño frontend premium ([Leonxlnx](https://github.com/Leonxlnx/taste-skill)) |
| `webapp-testing` | Anthropic | Pruebas web |
| `claude-api` | Anthropic | Guía API Anthropic |

Detalle: `skills/README.md`

### Herramientas `claude-api`

| Tool | Descripción |
|------|-------------|
| `ask_claude` | Consulta general |
| `review_with_claude` | Revisión código/arquitectura |
| `count_tokens` | Estimar tokens |
