# Plan de pruebas de aceptación — ST-001 (lote de estabilización tras EN-001)

- **Elemento:** ST-001
- **Defectos:** BUG-001, BUG-002, BUG-003 (severidad Menor)
- **Fecha:** 2026-11-24
- **Navegador:** Chromium (proyecto `chromium` de `tests/acceptance/playwright.config.ts`), esquema de color claro por defecto de Playwright.
- **Alcance:** demostrar que los tres defectos descritos en `specs/ST-001/ST-001.md` existen contra el código actual (RED) y que se corrigen sin tocar los comportamientos aceptados de EN-001.

## Fuente del contrato

`specs/ST-001/ST-001.md` trae la tabla de defectos y su comportamiento correcto, y la decisión D-01. **No existe `specs/ST-001/plan.md`**, así que el contrato de interfaz se tomó de:

- los criterios aceptados de EN-001 (`specs/EN-001/EN-001.md`) y sus pruebas (`tests/acceptance/tests/en-001.spec.ts`);
- `DESIGN.md` (tokens `--action`, anillo de foco de 3 px, unidad de 4 px);
- `docs/design-catalog.md` (región de estado única con `role="status"`, aviso en `role="alert"` con su botón como hermano, foco al estado con `tabIndex={-1}` y anillo `:focus-visible` de 3 px `--action`).

Selectores usados, todos del contrato: `h1` (nombre de la app), `getByRole('status')`, `getByRole('alert')`, `getByRole('button', { name: 'Reintentar' })`. Los textos se comparan con los de la especificación (`Conectando…` se reconoce por el prefijo `^Conectando` para no depender del carácter exacto de puntos suspensivos).

## Matriz criterio → prueba

Archivo: `tests/acceptance/tests/st-001.spec.ts`.

| Criterio | Prueba | Etiqueta | Qué demuestra |
|---|---|---|---|
| BUG-001: el anillo de foco del estado enfocado con teclado es 3 px `--action` | `BUG-001 el anillo de foco del estado, al navegar con teclado, es el de DESIGN.md (3 px de --action)` | `@ST-001`, `@BUG-001` | Con el servidor caído, Tab hasta «Reintentar» y Enter con el servidor disponible. El estado recibe el foco y su indicador es 3 px del color resuelto de `--action`, no `--ink-muted`. |
| BUG-002: con el ratón el estado recibe el foco pero no dibuja recuadro | `BUG-002 tras reintentar con el ratón, el estado recibe el foco sin recuadro de foco` | `@ST-001`, `@BUG-002` | Clic con el ratón en «Reintentar» con el servidor disponible: el estado queda enfocado (no se pierde el foco) y no hay `outline` ni `box-shadow` de foco. |
| BUG-003 (1): la separación de la tarjeta es igual en los tres estados | `BUG-003 (1) la separación entre el título y el siguiente elemento es igual en conectando, conectado y sin conexión` | `@ST-001`, `@BUG-003` | Mide la distancia vertical entre el `h1` y el primer elemento visible que le sigue: el `alert` sin conexión y el `status` al conectar/conectado. Exige una diferencia máxima de 1 px entre los tres valores, con la respuesta de `/api/health` retenida para observar «Conectando…». |
| BUG-003 (2): durante «Conectando…» el foco está en el estado; si conecta sigue ahí y si falla vuelve a «Reintentar» (D-01) | `BUG-003 (2a) durante «Conectando…» el foco está en el estado y sigue ahí al conectar` y `BUG-003 (2b) si el reintento vuelve a fallar, el foco regresa a «Reintentar»` | `@ST-001`, `@BUG-003` | Activa «Reintentar» con el teclado y retiene la respuesta. Durante «Conectando…» exige que `document.activeElement` sea el `role="status"`; después exige que el foco siga en el estado (éxito) o vuelva al botón (fallo). |

## Diseño de las pruebas

- **Solo contrato:** roles accesibles y textos de la especificación; nada de clases CSS ni de estructura interna. El color del anillo se resuelve del token `--action` de `DESIGN.md` en el propio navegador, no se codifica el hexadecimal en la prueba.
- **Sin supuestos de implementación sobre el indicador:** `hasActionRing` acepta un `outline` de 3 px del color de acción o un `box-shadow` que contenga ese color y 3 px. `hasAnyRing` detecta cualquier `outline`/`box-shadow` visible.
- **Datos aislados:** ninguna prueba crea tareas ni compara totales. Cada una abre su propia página, intercepta `/api/health` (mecanismo ya usado por AC-03/AC-04 de EN-001) y no depende de otra.
- **Sin `serial` ni reutilización de servidores:** el fixture arranca y detiene el servidor; el patrón de rutas es local a cada página.
- **Estados difíciles de observar:** «Conectando…» se obtiene reteniendo la petición con `page.route` y liberándola después; el fallo se obtiene liberando la petición con `route.abort('failed')`.

## Pruebas de caracterización

No se agregaron pruebas de caracterización con etiqueta de otra historia. Los comportamientos de EN-001 que ST-001 debe conservar ya están cubiertos por `@EN-001` y siguen sin cambios.

Dentro de BUG-002, la mitad «con teclado el anillo sí se ve» y «el foco no se pierde» ya se cumplen hoy; una prueba independiente de esa mitad pasaría contra la base y rompería el RED. Por eso:

- el anillo visible con teclado se comprueba en BUG-001, que falla por el color;
- el foco no perdido se comprueba como aserción dentro de BUG-002, cuya parte que falla es el recuadro con ratón.

## Casos negativos y límites

- **Aviso sin conexión:** se provoca abortando `/api/health`; sirve de estado inicial de las cinco pruebas.
- **Respuesta lenta:** la petición se retiene sin límite de tiempo; la prueba solo la libera después de medir «Conectando…».
- **Fallo repetido:** BUG-003 (2b) libera la petición con `abort`, de modo que el reintento vuelve a fallar y se comprueba el regreso del foco.
- **Tolerancia de separación:** 1 px, por subpíxeles del motor de composición; las diferencias reales del defecto son de 16 px (32 px frente a 16 px).

## RED confirmado

Ejecutado desde la raíz del repo, contra el código actual de `qa/ST-001` (sin cambios de producción):

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="$env:TEMP\red-st-001.json"
npm --prefix tests/acceptance test -- --grep "@ST-001(?![\w-])" --reporter=list,json
node ci/red-check.mjs "$env:TEMP\red-st-001.json" ST-001 0 specs/ST-001/ST-001.md
```

Resultado de Playwright: **5 pruebas ejecutadas, 5 fallidas, 0 omitidas**.

Salida literal de `ci/red-check.mjs`:

```text
Historia: @ST-001 | pruebas encontradas: 5 | ejecutadas: 5
  - [failed] BUG-001 el anillo de foco del estado, al navegar con teclado, es el de DESIGN.md (3 px de --action)  →  Error: el foco del estado debe dibujar 3 px de --action (rgb(214, 61, 26)); se dibujó {"outlineStyle":"solid","outlineWidth":"3px","outlineColor":"rgb(110, 102,
  - [failed] BUG-002 tras reintentar con el ratón, el estado recibe el foco sin recuadro de foco  →  Error: con el ratón el estado no debe dibujar recuadro de foco; se dibujó {"outlineStyle":"solid","outlineWidth":"3px","outlineColor":"rgb(110, 102, 92)","boxSh
  - [failed] BUG-003 (1) la separación entre el título y el siguiente elemento es igual en conectando, conectado y sin conexión  →  Error: la separación título→elemento debe ser la misma en los tres estados: {"offline":32,"connecting":16,"connected":16}
  - [failed] BUG-003 (2a) durante «Conectando…» el foco está en el estado y sigue ahí al conectar  →  Error: expect(locator).toBeFocused() failed
  - [failed] BUG-003 (2b) si el reintento vuelve a fallar, el foco regresa a «Reintentar»  →  Error: expect(locator).toBeFocused() failed
Trazabilidad OK: 5 pruebas, todas con un criterio de specs/ST-001/ST-001.md.
RED confirmado: las 5 pruebas de @ST-001 se ejecutaron y fallaron. Revisa arriba que cada una falle por la razón esperada.
```

### Por prueba: resultado, razón y ¿esperada?

| Prueba | Resultado | Razón del fallo | ¿Es la razón esperada? |
|---|---|---|---|
| BUG-001 | Falla | El estado enfocado dibuja `outline` sólido de 3 px con `rgb(110, 102, 92)` (`--ink-muted`) en vez de `rgb(214, 61, 26)` (`--action`). | Sí: es exactamente F-1/BUG-001. |
| BUG-002 | Falla | Tras el clic con ratón, el estado tiene `outline` sólido de 3 px gris: se dibuja recuadro de foco. | Sí: es F-2/BUG-002. |
| BUG-003 (1) | Falla | La separación título→elemento es 32 px sin conexión frente a 16 px conectando y 16 px conectado. | Sí: es el hueco de 16 px del estado vacío (F-3, parte 1). |
| BUG-003 (2a) | Falla | Durante «Conectando…» el estado no está enfocado (`inactive`); el foco quedó fuera. | Sí: es la parte 2 de F-3. |
| BUG-003 (2b) | Falla | Durante «Conectando…» el estado no está enfocado; por tanto tampoco se puede comprobar el regreso al botón. | Sí: la causa raíz es la parte 2 de F-3. |

**Comandos de verificación:** no se escribieron. Los tres criterios se comprueban con pruebas de aceptación de navegador (anillo, foco y separación visual), así que `specs/ST-001/*.verify` no aplica y `ci/run-verify.sh` no se ejecutó.

## Supuestos que requieren decisión

1. **Falta `specs/ST-001/plan.md`.** El contrato de interfaz se dedujo de EN-001, `DESIGN.md` y `docs/design-catalog.md`. ¿Se acepta esa fuente, o el lote debe llevar su propio contrato antes de programar?
2. **Anillo en tema claro.** Las pruebas corren con el esquema claro por defecto de Playwright y comparan contra el token `--action` resuelto (`#D63D1A`). El tema oscuro (`#FF7A59`, US-022) no forma parte del lote. ¿Se acepta?
3. **«Sin recuadro de foco» con el ratón = sin `outline` y sin `box-shadow` en el estado.** Si el estado tuviera una sombra decorativa en reposo, la prueba la consideraría un recuadro de foco. Hoy no la tiene. ¿Se acepta esta lectura de BUG-002?
4. **Separación medida como distancia vertical `h1` → primer elemento visible (`alert` o `status`), con tolerancia de 1 px.** No se comparan todos los pares de la tarjeta, solo el par que describe la reproducción («entre el título y el aviso / el texto de estado»). ¿Se acepta?
5. **«Conectando…» se reconoce por el prefijo `^Conectando`,** para no fijar el carácter exacto de los puntos suspensivos. Los demás textos se comparan literalmente con la especificación.
6. **La activación del reintento en BUG-003 (2) es con teclado (Tab + Enter).** D-01 no distingue modalidad y BUG-002 ya cubre el ratón. ¿Se acepta, o el lote exige también el camino de foco con ratón para D-01?
7. **La mitad «con teclado el anillo sí se ve» de BUG-002 no tiene prueba propia** (pasaría hoy). Queda cubierta por BUG-001 y por la aserción de foco de BUG-002. ¿Se acepta como cobertura suficiente?
