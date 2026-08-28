---
name: frontend-style
description: >-
  Aplica estándares de diseño UI del producto al crear o editar pantallas y
  componentes en web (Angular) o mobile (Flutter). Usar cuando se cree o edite
  cualquier componente de UI en /web o /mobile, incluidos modales, formularios
  de cálculo, resultados, exportación PDF y flujos de pago/suscripción.
---

# Frontend Style — Estándares de diseño

Skill de proyecto para mantener coherencia visual entre Angular y Flutter. Referencia de funcionalidad: bruttonetto.arbeiterkammer.at. Referencia de **calidad visual**: superar a AK en pulido, sin sacrificar velocidad ni claridad.

---

## Principios generales

1. **Moderno y minimalista** — mucho aire, jerarquía clara, sin ruido visual.
2. **Más pulido que AK** — tipografía cuidada, estados hover/focus/disabled, transiciones sutiles (150–250 ms).
3. **Igual de rápido y directo** — el usuario llega al cálculo en pocos pasos; no bloquear con animaciones largas ni pasos innecesarios.
4. **Un solo producto, dos clientes** — web y mobile deben sentirse como la misma marca (colores, spacing, tono).
5. **Multi-idioma desde el diseño** — textos nunca hardcodeados; layouts que toleren DE (largo) y TR/UK sin romperse.

---

## Referencia visual (tokens compartidos)

Definir y reutilizar estos tokens en web (Tailwind) y mobile (ThemeData / extensiones). No inventar valores ad hoc por pantalla.

| Token | Uso | Valor sugerido inicial |
|-------|-----|------------------------|
| `--color-primary` | CTAs, enlaces activos | Azul profundo confiable (~ `#1E40AF`) |
| `--color-primary-hover` | Hover CTA | ~10% más oscuro |
| `--color-surface` | Fondos de tarjeta | `#FFFFFF` / `#F8FAFC` |
| `--color-surface-elevated` | Modales, dropdowns | `#FFFFFF` + sombra suave |
| `--color-text-primary` | Títulos, cuerpo | `#0F172A` |
| `--color-text-secondary` | Labels, hints | `#64748B` |
| `--color-border` | Divisores, inputs | `#E2E8F0` |
| `--color-success` | Resultado positivo | `#059669` |
| `--color-warning` | Intentos restantes bajos | `#D97706` |
| `--color-error` | Errores validación | `#DC2626` |
| `--radius-sm` | Inputs, chips | `6px` |
| `--radius-md` | Tarjetas | `12px` |
| `--radius-lg` | Modales | `16px` |
| `--space-xs` … `--space-2xl` | Escala 4/8/12/16/24/32/48 | Base 4px |
| `--font-sans` | UI | Inter, system-ui, sans-serif |
| `--text-xs` … `--text-2xl` | Escala tipográfica | 12 / 14 / 16 / 18 / 24 / 30 px |

Documentar valores finales en `web/src/styles/` y `mobile/lib/core/theme/` cuando existan.

---

## Angular (`/web`)

### Stack UI

- **TailwindCSS** como sistema principal de utilidades.
- **SCSS** solo para tokens globales, overrides puntuales o `@apply` en capas base — no mezclar estilos ad hoc en cada componente.
- **Standalone components** + **Signals** para estado de UI local.

### Reglas Tailwind

- Usar **clases semánticas agrupadas** vía `@apply` en archivos de componente SCSS o clases utilitarias reutilizables en `styles/_components.scss`, por ejemplo:
  - `.btn-primary`, `.input-field`, `.card-result`, `.modal-shell`
- **Prohibido:** cadenas de 15+ clases inline en plantillas HTML sin abstracción.
- **Spacing:** solo escala Tailwind estándar (`p-4`, `gap-6`, etc.) alineada a tokens.
- **Tipografía:** `text-sm` / `text-base` / `text-lg` + `font-medium` / `font-semibold` de forma consistente.
- **Estados:** siempre definir `focus-visible:ring-2`, `disabled:opacity-50`, `aria-*` en controles interactivos.

### Patrones de pantalla

- **Formulario de cálculo:** una columna en móvil; máximo dos columnas en desktop; labels arriba del input.
- **Resultados:** tarjeta destacada con Brutto → deducciones → Netto; números tabulares (`font-variant-numeric: tabular-nums`).
- **Intentos gratuitos:** badge discreto, no intrusivo; aviso claro al agotar intentos antes del modal de pago.
- **Cambio de idioma:** selector visible en header; cambio instantáneo sin recargar ni side effects.

### Modal de pago

- Un solo modal reutilizable (`PaymentModalComponent` o equivalente).
- **Sin elementos duplicados:** un CTA principal, un secundario (cancelar), logos Stripe/PayPal una sola vez.
- Tabs o toggle claro Stripe | PayPal si ambos están disponibles.
- Copy i18n para los 6 idiomas desde el primer commit del modal.
- Fondo con overlay `bg-black/50`; cierre con Escape y clic fuera (si aplica accesibilidad).

---

## Flutter (`/mobile`)

### Arquitectura UI

- **Clean Architecture:** widgets en `presentation/`, sin lógica fiscal en UI.
- **Riverpod** para estado de pantalla y providers de tema/i18n.

### Paridad con web

- Mismos tokens de color, radius, spacing y tipografía (mapear a `ThemeData` + `AppSpacing`, `AppColors`).
- Mismos nombres de concepto en UI (no traducir claves distintas entre plataformas).
- Componentes equivalentes:
  - `PrimaryButton` ↔ `.btn-primary`
  - `AppTextField` ↔ `.input-field`
  - `ResultCard` ↔ `.card-result`
  - `PaymentBottomSheet` / `PaymentDialog` ↔ modal web (misma estructura, sin duplicar CTAs)

### Reglas Flutter

- Preferir `Theme.of(context)` y extensiones sobre colores literales en widgets.
- `effective_dart`: trailing commas, `const` donde aplique, evitar `print`.
- Soporte **texto largo alemán** en botones (`FittedBox`, `Flexible`, `maxLines` + ellipsis).
- Safe area y teclado: formularios scrollables con `SingleChildScrollView`.

---

## Accesibilidad y UX

- Contraste mínimo WCAG AA en texto e inputs.
- Targets táctiles ≥ 44×44 px en mobile.
- Mensajes de error junto al campo, no solo toast genérico.
- Loading: skeleton o spinner pequeño en botón de calcular; no bloquear toda la pantalla salvo primera carga.

---

## Checklist antes de dar por terminada una pantalla

- [ ] Usa tokens/colores compartidos, no valores sueltos
- [ ] Textos vía i18n (6 idiomas contemplados en layout)
- [ ] Sin lógica de cálculo fiscal en el cliente
- [ ] Modal de pago sin CTAs ni logos duplicados
- [ ] Estados empty, loading, error y success definidos
- [ ] Paridad visual razonable con la otra plataforma (web ↔ mobile)

---

## Anti-patrones (evitar)

- Gradientes recargados, sombras duras, iconografía inconsistente
- Mezclar Bootstrap/Material sin criterio con Tailwind
- Hardcodear strings en alemán solo en web y otro idioma en mobile
- Dos modales de pago distintos (web vs mobile) con flujos divergentes
- Copiar el layout feo de AK sin mejorar tipografía, spacing y feedback visual
