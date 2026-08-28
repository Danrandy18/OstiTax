# CLAUDE.md — Contexto permanente del proyecto

Documento de referencia para agentes (Cursor, Claude, MCP) y desarrolladores. Define stack, arquitectura, reglas de negocio y convenciones antes de implementar funcionalidad.

---

## Propósito del producto

Calculadora fiscal/salarial para Austria orientada a trabajadores y familias. El backend es la **única fuente de verdad** para todos los cálculos. Web (Angular) y mobile (Flutter) son clientes del API; no replican lógica fiscal.

Referencia funcional de precisión: [bruttonetto.arbeiterkammer.at](https://bruttonetto.arbeiterkammer.at) (Arbeiterkammer). Objetivo: coincidir al céntimo con AK y tablas vigentes del BMF.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| **Backend** | NestJS 11, TypeORM, PostgreSQL | API REST, webhooks, motor de cálculo |
| **Web** | Angular 21.1.x (CLI 21.1.3), standalone components, Signals | TailwindCSS + SCSS, proxy `/api`. Angular 22 pendiente de actualizar Node |
| **Mobile** | Flutter, Clean Architecture, Riverpod | Mismo contrato API que web |
| **Pagos** | Stripe Billing, PayPal Subscriptions | Estado `free`/`pro` solo vía webhooks |
| **Infra local** | Docker Compose (PostgreSQL) | Ver `docker-compose.yml` |

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐
│  web/       │     │  mobile/    │
│  Angular    │     │  Flutter    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  POST /api/calculate
       │  (y demás endpoints)
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │   backend/    │
         │   NestJS      │  ← única fuente de verdad del cálculo
         │   PostgreSQL  │
         └───────────────┘
```

### Principios

1. **Ni Angular ni Flutter calculan impuestos localmente.** Solo envían inputs al backend y muestran la respuesta.
2. **El endpoint principal de cálculo:** `POST /api/calculate`.
3. **Validación de suscripción e intentos gratuitos:** exclusivamente en backend (middleware/guards + persistencia).
4. **Webhooks de pago:** Stripe y PayPal actualizan el estado del usuario; los clientes nunca confían en flags locales para `pro`.

---

## Estructura de carpetas

```
app_calculos/
├── backend/          # NestJS — motor fiscal, auth, pagos, webhooks
├── web/              # Angular — UI web
├── mobile/           # Flutter — UI móvil
├── skills/           # Skills MCP (Anthropic + proyecto); ver skills/README.md
├── tools/            # claude-api-mcp (MCP local), Flutter SDK local
├── docker-compose.yml
└── CLAUDE.md         # Este archivo
```

---

## Reglas de negocio (no negociables)

### a) Motor de cálculo fiscal

Debe coincidir **al céntimo** con Arbeiterkammer y tablas vigentes del BMF. Incluye, como mínimo:

- Tramos de **Einkommensteuer**
- **Sozialversicherung** según tipo de empleo:
  - Angestellte/r
  - Arbeiter/in
  - Estudiante
  - Selbstständige
- **13.º y 14.º sueldo** con **Jahressechstel**
- Tramo **> 1 M€ al 55%**
- **Alleinverdienerabsetzbetrag**
- **Familienbonus Plus**
- **Pendlerpauschale**

Los tests de regresión deben comparar salidas contra casos de referencia AK/BMF documentados en el repo.

### b) Sistema de 3 intentos gratuitos

- Controlado **solo en el backend** (contador persistido por usuario/dispositivo según diseño de auth).
- **Cambiar de idioma NUNCA descuenta un intento.**
- Los clientes pueden mostrar el contador restante, pero no deciden ni decrementan intentos.

### c) Internacionalización (i18n)

| Ámbito | Idiomas | Regla |
|--------|---------|-------|
| **UI** | DE, EN, TR, BCS, ES, UK | 100% traducida en los 6 idiomas |
| **PDF exportado** | Solo alemán oficial | Siempre DE, con terminología oficial: *Bruttobezug*, *Sozialversicherung*, *Lohnsteuer*, *Nettobezug* — **independiente del idioma de la UI** |

### d) Pagos y planes

- **Stripe Billing** y **PayPal Subscriptions**
- Estado `free` / `pro` validado **únicamente vía webhooks** en backend
- No confiar en respuestas del cliente ni en localStorage/SharedPreferences para acceso premium

---

## Convenciones de código

### Commits — Conventional Commits

Formato: `<type>(<scope>): <descripción breve>`

| type | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato (sin cambio de lógica) |
| `refactor` | Refactor sin cambiar comportamiento |
| `test` | Tests |
| `chore` | Build, deps, config |

Scopes habituales: `backend`, `web`, `mobile`, `calc`, `i18n`, `payments`.

Ejemplos:

```
feat(backend): add POST /api/calculate endpoint skeleton
fix(web): prevent language switch from triggering attempt decrement
docs: update CLAUDE.md with BMF table references
```

### TypeScript (backend + web)

- **ESLint** + **Prettier** (configs del proyecto; no desactivar reglas sin motivo)
- Imports ordenados; preferir `const` y tipos explícitos en APIs públicas
- NestJS: módulos por dominio (`calc`, `users`, `billing`, `i18n`)
- Angular: **standalone components**, **Signals** para estado local; servicios para API

### Flutter (mobile)

- **effective_dart** y análisis con `flutter analyze` sin warnings
- **Clean Architecture:** `domain` → `data` → `presentation`
- **Riverpod** para estado y DI
- No duplicar lógica fiscal; repositorios llaman al mismo API que Angular

### General

- Nombres en inglés en código; textos de usuario vía claves i18n
- Comentarios solo para lógica fiscal o reglas no obvias
- Secretos en `.env`; nunca commitear API keys

---

## Integración Claude + Cursor (MCP de terceros)

**No es integración nativa de Anthropic.** Son servidores MCP configurados en `.cursor/mcp.json`:

| Servidor | Origen | Función |
|----------|--------|---------|
| `skills-mcp` | npm [`skills-mcp`](https://github.com/agustinustheo/skills-mcp) | Expone skills de `skills/` vía `list_skills` / `get_skill` |
| `claude-api` | Local: `tools/claude-api-mcp/` | Llama a la API de Anthropic: `ask_claude`, `review_with_claude`, `count_tokens` |
| `playwright` | npm `@playwright/mcp` | Automatización Playwright (headless) |
| `agent-browser` | CLI [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Navegador token-efficient: abrir web, snapshots, clicks, screenshots, QA |

### Requisitos para que funcione

1. `ANTHROPIC_API_KEY` en variables de entorno del sistema (ver `.env.example`)
2. Servidores **activados manualmente** en Cursor → **Settings → Tools & MCP**
3. Reiniciar Cursor tras cambiar `.cursor/mcp.json`

### Skills instalados (`skills/`)

- **Anthropic (ejemplos):** `skill-creator`, `mcp-builder`, `frontend-design`, `webapp-testing`, `claude-api`
- **Vercel Labs:** `web-design-guidelines`, `find-skills`, `agent-browser`
- **TypeUI / Awesome Design Skills:** `awesome-design` (estilo Clean del registro [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills))
- **Comunidad:** `taste-skill`
- **Proyecto:** `frontend-style` — estándares UI de este producto

Reglas del agente: `.cursor/rules/claude-integration.mdc`

---

## Qué NO hacer (todavía)

- Implementar fórmulas fiscales sin tests de regresión AK/BMF
- Calcular impuestos en web o mobile
- Decrementar intentos desde el cliente
- Generar PDF en idioma distinto al alemán oficial
- Marcar usuario como `pro` sin webhook verificado

---

## Próximos pasos previstos (fuera de este documento)

1. Contrato OpenAPI de `POST /api/calculate`
2. Módulo de cálculo en backend con tablas BMF versionadas
3. i18n en web y mobile (6 idiomas UI)
4. Flujo de intentos gratuitos + modal de pago
5. Webhooks Stripe/PayPal
