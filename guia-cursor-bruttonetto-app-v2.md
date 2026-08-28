# Guía de Proyecto v2 — "Brutto-Netto Rechner Austria" (Angular + Flutter)

## 1. Objetivo

Reescribir desde cero una calculadora de salario/impuestos para Austria, a la par o por encima de la oficial de la Arbeiterkammer (https://bruttonetto.arbeiterkammer.at), con:

- **Web:** Angular (Standalone components, Signals, TailwindCSS/SCSS)
- **Mobile:** Flutter (Clean Architecture, BLoC o Riverpod)

## 2. El problema de arquitectura que hay que resolver primero

El borrador original propone un "core de cálculo puro en TypeScript" reutilizado por ambos clientes. **Eso funciona para Angular, pero no existe forma nativa de que Flutter (Dart) ejecute TypeScript.** Antes de que Cursor escriba una sola línea, hay que decidir entre estas dos opciones — dile a Cursor cuál eliges:

**Opción A — Backend como única fuente de verdad (recomendada)**
Un servicio (NestJS o Firebase Functions) expone `POST /api/calculate`. Angular y Flutter solo llaman a la API, nunca calculan localmente. Ventajas: un solo lugar donde corregir/actualizar tablas fiscales cada año, control real de los 3 intentos gratuitos (no manipulable desde el cliente), mismo backend sirve para Stripe/PayPal y OCR. Desventaja: requiere conexión a internet para calcular.

**Opción B — Motor duplicado (TS + Dart) con casos de prueba compartidos**
Se implementa el `AustrianTaxCalculator` dos veces (uno en TypeScript para Angular, uno en Dart para Flutter), pero **ambos se validan contra el mismo archivo JSON de casos de prueba** extraídos manualmente de la AK, para garantizar que no diverjan. Ventaja: funciona offline. Desventaja: mantenimiento doble cada vez que cambian las tablas fiscales.

Con pagos, OCR y control de intentos en juego, la Opción A es más segura contra fraude y más fácil de mantener — pero si el cliente quiere que la calculadora funcione sin internet, ve con la Opción B y sé disciplinado con los tests compartidos.

## 3. Reglas de negocio críticas

### A. Motor de cálculo fiscal
Debe coincidir al céntimo con la AK y las tablas del BMF vigentes:
- Tramos de Einkommensteuer (IRPF austríaco)
- Sozialversicherung según tipo: Angestellte/r, Arbeiter/in, estudiante, Selbstständige
- 13º/14º sueldo (Urlaubs- und Weihnachtsgeld) con tributación preferencial (Jahressechstel)
- Tramo superior >1M€ al 55%, y tramos altos >10.000€ brutos/mes
- Deducciones: Alleinverdienerabsetzbetrag, Familienbonus Plus, Pendlerpauschale

### B. Sistema de intentos gratuitos
- 3 intentos gratuitos por usuario.
- **Cambiar de idioma NUNCA consume un intento** — el estado del idioma debe ser reactivo y estar completamente desacoplado del contador de intentos.
- Los intentos solo se descuentan al ejecutar un cálculo con datos de entrada nuevos.
- Si eliges Opción A (backend), el contador vive en el servidor, ligado a sesión/usuario — no en localStorage, para que no sea trivial de resetear.

### C. Internacionalización estricta
- 6 idiomas: alemán, inglés, turco, bosnio/croata/serbio, español, ucraniano.
- 100% de la UI traducida: labels, tooltips, modal de pago, resultados.
- **Excepción del PDF:** el reporte exportado debe estar **siempre en alemán oficial (Amtssprache)**, sin importar el idioma de la interfaz, con terminología oficial (Bruttobezug, Sozialversicherung, Lohnsteuer, Nettobezug), porque debe tener validez ante el Finanzamt.

### D. Exportación PDF
Comprobante limpio, profesional, en alemán, con el desglose oficial.

### E. Diseño UI/UX
Moderno, minimalista, más pulido que la AK pero igual de rápido de usar. Modal de pago sin elementos duplicados, multi-idioma.

## 4. Pagos (Stripe + PayPal)

- Stripe Billing para suscripción recurrente (tarjeta + Apple Pay + Google Pay).
- PayPal Subscriptions como alternativa.
- El estado free/pro se valida y persiste en el backend vía webhooks — nunca solo en el cliente, o alguien lo salta editando el estado local.

## 5. Roadmap de implementación para Cursor

1. **Decidir Opción A o B** (sección 2) antes de escribir código.
2. Motor de cálculo (`AustrianTaxCalculator`) + tests unitarios contra casos reales de la AK (`tax-calculator.spec.ts`).
3. Servicio de i18n (6 idiomas) desacoplado del contador de intentos.
4. UI: formulario reactivo + resultados (arquitectura por features: `features/calculator`, `features/payment`, `core/i18n`, `shared/ui`).
5. Generador de PDF en alemán (`pdfmake` o `jspdf` en Angular; `pdf` package en Flutter).
6. Control de intentos + modal de pago (Stripe + PayPal).
7. Réplica de todo el flujo en Flutter apuntando al mismo backend (si Opción A) o al motor Dart validado (si Opción B).

## 6. Prompt listo para pegar en Cursor

```
Vamos a reconstruir desde cero "Brutto-Netto Rechner Austria", una calculadora
de salario/impuestos para Austria, comparable con https://bruttonetto.arbeiterkammer.at.

Stack: Angular (standalone components, Signals, TailwindCSS/SCSS) para web,
Flutter (Clean Architecture, Riverpod) para mobile.

Arquitectura: usa un backend (NestJS) como única fuente de verdad para el
cálculo fiscal, expuesto en POST /api/calculate. Ni Angular ni Flutter
calculan impuestos localmente — ambos consumen esta API. El backend también
controla el contador de intentos gratuitos por usuario/sesión (no en el
cliente), los webhooks de Stripe y PayPal, y la generación del PDF final.

Reglas de negocio no negociables:
1. El motor de cálculo debe coincidir al céntimo con la AK y las tablas
   vigentes del BMF: tramos de Einkommensteuer, Sozialversicherung según
   tipo (Angestellte/r, Arbeiter/in, estudiante, Selbstständige), 13º/14º
   sueldo con Jahressechstel, tramo >1M€ al 55%, Alleinverdienerabsetzbetrag,
   Familienbonus Plus, Pendlerpauschale.
2. Sistema de 3 intentos gratuitos por usuario. Cambiar de idioma NUNCA debe
   descontar un intento — el idioma es un estado reactivo totalmente
   desacoplado del contador.
3. Interfaz 100% traducida en 6 idiomas (alemán, inglés, turco, BCS,
   español, ucraniano), PERO el PDF exportado debe estar SIEMPRE en alemán
   oficial, con terminología oficial (Bruttobezug, Sozialversicherung,
   Lohnsteuer, Nettobezug), sin importar el idioma de la interfaz.
4. Diseño moderno y minimalista, más pulido que la AK, mismo nivel de
   rapidez de uso. Modal de pago (Stripe + PayPal) limpio, sin duplicados,
   multi-idioma.

Empieza así:
1. Crea el monorepo: /backend (NestJS), /web (Angular), /mobile (Flutter).
2. En /backend, implementa el módulo tax-engine con tests unitarios
   validados contra casos reales de la AK, antes de tocar cualquier UI.
3. Expón /api/calculate y avísame cuando esté listo para revisar los
   resultados de los tests antes de seguir con el resto.
```

## 7. MCP y herramientas sugeridas para Cursor

- **Stripe MCP** — gestionar productos, precios y webhooks sin salir de Cursor.
- **Playwright/Browser MCP** — testear el flujo de pago y los formularios end-to-end.
- **Context7** (o similar) — documentación actualizada de Angular/Flutter/NestJS en contexto.
- **Figma MCP** — si terminas teniendo diseños, para traducirlos a componentes.

## 8. Presupuesto orientativo (referencia de mercado, no cotización cerrada)

| Fase | Rango orientativo |
|---|---|
| Discovery/UX | 500–1.200 € |
| Motor de cálculo + backend (incl. validación fiscal exhaustiva) | 3.000–6.500 € |
| Frontend web (Angular) | 2.000–4.500 € |
| App móvil (Flutter) | 2.500–5.000 € |
| Pagos (Stripe + PayPal) + control de intentos server-side | 900–2.000 € |
| OCR real + PDF en alemán + FinanzOnline | 1.200–2.800 € |
| QA + despliegue | 500–1.200 € |
| **Total aproximado** | **10.600 € – 23.200 €** |

El rango subió respecto a la primera estimación porque las reglas de negocio (validación fiscal al céntimo, PDF siempre en alemán, control de intentos server-side) añaden trabajo real de backend y testing que no estaba detallado antes.
