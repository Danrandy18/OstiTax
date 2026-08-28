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

## Próximos pasos sugeridos

- Definir entidades y módulos en NestJS
- Conectar Angular y Flutter al backend
- Añadir autenticación y migraciones de base de datos

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
