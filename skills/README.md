# Skills del proyecto

Carpeta única escaneada por el MCP [`skills-mcp`](https://github.com/agustinustheo/skills-mcp) (paquete npm de terceros, no oficial de Anthropic).

Cursor descubre estos skills vía `list_skills` / `get_skill` cuando `skills-mcp` está activo en **Settings → Tools & MCP**.

## Skills de ejemplo (Anthropic)

Descargados del repo [anthropics/skills](https://github.com/anthropics/skills):

| Id | Origen | Uso |
|----|--------|-----|
| `skill-creator` | Anthropic | Crear nuevos skills |
| `mcp-builder` | Anthropic | Construir servidores MCP |
| `frontend-design` | Anthropic | Diseño UI genérico de alta calidad |
| `webapp-testing` | Anthropic | Pruebas de aplicaciones web |
| `claude-api` | Anthropic | Uso correcto de la API de Anthropic |

## Skills de terceros

| Id (carpeta) | Install name | Origen | Uso |
|--------------|--------------|--------|-----|
| `web-design-guidelines` | `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Auditoría UI: accesibilidad, jerarquía visual, responsive, formularios |
| `find-skills` | `find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) | Descubrir e instalar skills del ecosistema ([skills.sh](https://skills.sh)) |
| `agent-browser` | `agent-browser` | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Automatización de navegador para el agente (snapshots, clicks, QA) |
| `awesome-design` | `clean` (TypeUI) | [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | Design system **Clean**: minimal, whitespace, tipografía legible |
| `taste-skill` | `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Diseño frontend premium anti-plantilla (v2) |

> Vercel Labs y Leonxlnx **no son Anthropic**. Popular en Claude Code / Cursor.

## Skills de proyecto (propios)

| Id | Uso |
|----|-----|
| `frontend-style` | Estándares de diseño UI de **este producto** (Angular + Flutter, tokens, modal de pago, i18n) |

> `frontend-design` (Anthropic) es guía genérica; `frontend-style` (proyecto) define la identidad visual concreta. `web-design-guidelines` (Vercel) sirve para **auditar** UI existente. `taste-skill` aporta criterio anti-plantilla; para UI de producto **priorizar `frontend-style`**.

## Añadir un skill

1. Crear `skills/<nombre>/SKILL.md` con frontmatter YAML (`name`, `description`).
2. Reiniciar o recargar MCP en Cursor.
3. Verificar con `list_skills`.

Ver también `skills/skill-creator/` para el flujo completo de creación.
