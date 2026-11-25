# TASK-001 — El estado de conexión enfoca y se separa como el resto de la pantalla

- **Historia/Enabler/Bug/Lote:** ST-001 (BUG-001, BUG-002, BUG-003)
- **Track:** T1
- **Estado:** Ready
- **Agente asignado:** programador
- **Nivel de modelo:** estándar
- **Datos que ve el rol:** solo código
- **Riesgo:** Low
- **Ciclos FAIL acumulados:** 0 / 3

## Objetivo y resultado esperado
En la pantalla de inicio, el texto de estado (`role="status"`) usa el mismo anillo de foco que los controles (3 px `--action`, solo con `:focus-visible`), no añade separación cuando está vacío, y recibe el foco en cuanto el usuario pulsa «Reintentar», de modo que el foco nunca cae en `body`.

## Alcance
- `src/web/src/styles.css`: quitar la regla `.status:focus`; ocultar visualmente el estado vacío sin desmontarlo.
- `src/web/src/App.tsx`: clase del estado vacío y foco al estado al iniciar el reintento.
- `src/web/src/App.test.tsx`: pruebas técnicas de lo anterior.

## Fuera de alcance
- Textos, catálogo de i18n, `checkHealth` y el servidor.
- Modo oscuro (US-022) y cualquier otro token o estilo de `DESIGN.md`.
- Reintento automático, deshabilitar el botón, spinner, animaciones.
- Cambiar la estructura de regiones vivas de EN-001 (un solo `role="status"` siempre montado; `role="alert"` aparte con el botón como hermano).

## Criterios que deja en verde
Única y última tarea del lote: sin `.criteria`; la CI ejecuta `@ST-001` completo (BUG-001, BUG-002 y BUG-003) más la regresión.

## Contexto técnico
- `docs/design-catalog.md`: región viva única y gestión del foco tras una acción que desmonta su control (EN-001).
- `DESIGN.md`: el anillo de foco es `--action` («Primary buttons, active tab, FAB, focus ring»).
- Hoy `styles.css` ya tiene `:focus-visible { outline: 3px solid var(--action); outline-offset: 2px; }` global; `.status:focus` lo sobrescribe con `--ink-muted` y además se dibuja con ratón.

## Superficie de cambio
`specs/ST-001/TASK-001.scope`.

## Restricciones y permisos
Sin dependencias nuevas. Presupuesto orientativo: producción ≤ 30 líneas, pruebas ≤ 80.

## Nota de diseño

### Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| `src/web/src/styles.css` — `.status:focus` | Existente, se **elimina** | — (el anillo lo da la regla global `:focus-visible`) |
| `src/web/src/styles.css` — `.status:focus:not(:focus-visible)` | Nueva | Quitar cualquier contorno cuando el foco llegó sin teclado: `outline: none;` |
| `src/web/src/styles.css` — `.status-empty` | Nueva | Sacar el estado vacío del flujo sin quitarlo del árbol de accesibilidad: `position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;` |
| `src/web/src/App.tsx` — `<p className="status">` | Existente | Llevar `className="status status-empty"` cuando `statusText[state] === ''` y `"status"` en otro caso. Mismo elemento, mismo `ref`, `role`, `tabIndex={-1}`: no se desmonta ni se cambia por otro |
| `src/web/src/App.tsx` — `retry()` | Existente | Antes de `setState('checking')`, llamar `statusRef.current?.focus()`. El resto igual (`retryInProgress.current = true`, `setAttempt`) |
| `src/web/src/App.tsx` — efecto sobre `state` | Existente, **sin cambios** | Con `'error'` enfoca «Reintentar»; con `'ok'` enfoca el estado (ya lo tiene) |
| `src/web/src/App.test.tsx` | Existente | Añadir pruebas (ver «Respuestas que la prueba técnica debe cubrir») |

### Patrón (nivel 2)
**Ninguno.** Dos reglas CSS y una línea de foco; no hay variantes que justifiquen un hook de foco ni un componente de estado.

### Lo que no se hace
- No se crea un hook `useFocus…` ni un componente `<Status>`: una sola pantalla.
- No se desmonta ni se renderiza condicionalmente el `role="status"`: el catálogo exige que esté montado desde la carga.
- No se usa `display: none` ni `visibility: hidden` ni `hidden` para el estado vacío: lo sacarían del árbol de accesibilidad y la región viva podría no anunciar el siguiente texto.
- No se usa `:empty` en CSS: depende de que React no cree un nodo de texto vacío; la clase explícita es determinista.
- No se cambia `gap` de `.card` ni de `.notice`, ni márgenes de otros elementos.
- No se añade `outline` ni `box-shadow` propio al estado: la regla global `:focus-visible` basta.
- No se mueve el foco con `setTimeout`, `requestAnimationFrame` ni en el efecto: va síncrono en `retry()`, antes de que React desmonte el botón.
- No se tocan `index.html`, `main.tsx`, `api/`, `i18n/` ni `src/server/`.

### Nivel 1 donde no es obvio
El foco del reintento se mueve en el manejador del evento (`retry`), no en un efecto, porque el botón que tiene el foco se desmonta en el siguiente render: si se espera al efecto, `document.activeElement` ya es `body`.

### Comportamiento dinámico de la interfaz
| Transición de estado (qué la causa) | Dónde queda el foco | Qué se anuncia y en qué región viva | Anillo de foco visible |
|---|---|---|---|
| Carga inicial → «Conectando…» | No se mueve (`body`) | «Conectando…» en `role="status"` | — |
| Carga inicial → conectado | No se mueve | «Conectado con el servidor» en `role="status"` | — |
| Carga inicial → sin conexión | No se mueve | «No se pudo conectar con el servidor» en `role="alert"`; el estado queda vacío con `status-empty` | — |
| Pulsar «Reintentar» → «Conectando…» | En el estado (`statusRef`), síncrono en `retry()` | «Conectando…» en `role="status"` | Solo con teclado (`:focus-visible`, 3 px `--action`); con ratón, ninguno |
| Reintento → conectado | Sigue en el estado (el efecto lo reafirma) | «Conectado con el servidor» en `role="status"` | Igual que la fila anterior |
| Reintento → sin conexión | En «Reintentar» (efecto existente) | Aviso en `role="alert"` | Solo con teclado (regla global del botón) |

- **Regiones vivas:** sin cambios respecto a EN-001: `role="status"` siempre montado; `role="alert"` se inserta con el aviso y su botón es hermano, no hijo.
- **Anillo por tipo de elemento:** controles y elemento de estado enfocado por programa usan el mismo anillo global `:focus-visible` (3 px `--action`, `outline-offset: 2px`). Con ratón no se dibuja nada en el estado. Esto sustituye la decisión de EN-001 de un anillo neutro (BUG-001, decisión del responsable del producto).
- **Espacio reservado:** el estado vacío no ocupa espacio ni suma `gap` (`status-empty`); con texto, vuelve al flujo. La separación título → siguiente elemento es 16 px en los tres estados.
- **Respuestas que la prueba técnica debe cubrir** (Vitest, `fetch` simulado):
  1. Error de red inicial → el `role="status"` tiene la clase `status-empty`; tras conectar, no la tiene.
  2. Error inicial, «Reintentar» con `userEvent` y `fetch` pendiente → mientras dice «Conectando…», `document.activeElement` es el `role="status"`; al resolver con `{status:"ok"}`, sigue siéndolo.
  3. Error inicial, «Reintentar» con `fetch` pendiente que luego falla (503 o rechazo) → durante «Conectando…» el foco está en el estado; al fallar, en «Reintentar».
  Las pruebas existentes de `App.test.tsx` siguen pasando sin cambios en sus aserciones.

### ¿Cambia el catálogo de diseño?
Sí, en el cierre: (a) el elemento de estado enfocado por programa usa el anillo global `:focus-visible` (sustituye el anillo neutro de EN-001; quita «Pendiente BUG-001»); (b) un elemento de estado vacío se saca del flujo con una clase de ocultación visual, nunca con `display: none`; (c) el foco de una acción que desmonta su control se mueve en el manejador, antes del render, al elemento de estado.

## Estados que introduce
Ninguno nuevo. `status-empty` es derivado: está presente si y solo si el texto del estado es vacío (`state === 'error'`).

## Dependencias
Ninguna.

## Comandos de validación exactos
```
npm --prefix src/web test
npm --prefix src/web run lint && npm --prefix src/web run typecheck && npm --prefix src/web run build
npm --prefix tests/acceptance test -- --grep "@ST-001(?![\w-])"
npm --prefix tests/acceptance test -- --grep "@EN-001(?![\w-])"
bash ci/validate.sh
```
