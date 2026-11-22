# Plan de pruebas de aceptación — EN-001

- **Elemento:** EN-001 (enabler, T2, P0)
- **Rama:** `qa/EN-001`
- **Fecha:** 2026-11-21
- **Fuentes:** `specs/EN-001/EN-001.md` (criterios y decisiones D-01…D-04), `specs/EN-001/plan.md`
  (contrato de interfaz y fila «Aceptación»), `docs/adr/ADR-001-stack.md` y `DESIGN.md`.
- **Base:** `origin/dev` 4b511f5. Todavía no existe código de aplicación (`src/`), así que el
  RED de esta suite es el «RED de arranque» propio de un enabler: la app que hay que probar es
  justamente lo que EN-001 crea.

## Suite creada

| Archivo | Contenido |
|---|---|
| `tests/acceptance/playwright.config.ts` | Un proyecto Chromium, un worker (servidor único en el puerto fijo del contrato), reporter `list`. |
| `tests/acceptance/fixtures/app.ts` | Fixture de worker que arranca la app como la usa el dueño: compila la web solo si existe `src/web/package.json` y ejecuta `cargo run --locked --manifest-path src/server/Cargo.toml` con `DATABASE_URL` a un archivo **inexistente** en una carpeta temporal, `APP_ADDR=127.0.0.1:5080` y `WEB_DIST=<repo>/src/web/dist`. Espera `GET /api/health`; al terminar detiene el servidor y borra la carpeta. |
| `tests/acceptance/tests/en-001.spec.ts` | Las 6 pruebas de aceptación de AC-01…AC-06. |
| `tests/acceptance/package.json` + `package-lock.json` | `@playwright/test` 1.65.1 y `@axe-core/playwright` 4.14.0. `npm test` = `playwright test`. |
| `specs/EN-001/EN-001.verify` | Comando de verificación de AC-07. |

Ejecución local (desde la raíz):

```bash
npm ci --prefix tests/acceptance
npm --prefix tests/acceptance exec playwright install chromium
npm --prefix tests/acceptance test -- --grep "@EN-001(?![\w-])"
```

## Matriz criterio → prueba

| Criterio | Prueba (`tests/acceptance/tests/en-001.spec.ts`) | Etiquetas | Qué comprueba | RED hoy |
|---|---|---|---|---|
| AC-01 | `AC-01 la app muestra el nombre y «Conectado con el servidor» al abrirla` (l. 14) | `@EN-001`, `@EN-001-AC-01` | `GET /` entrega una página con `<title>aes-todo</title>`, `<html lang="es">`, `<h1>` «aes-todo» y un `role="status"` con «Conectado con el servidor». | Falla: no hay servidor. |
| AC-02 | `AC-02 el primer arranque sin base de datos crea el archivo y responde que está bien` (l. 27) | `@EN-001`, `@EN-001-AC-02` | Con `DATABASE_URL` apuntando a un archivo que no existía: `GET /api/health` → `200 {"status":"ok"}`, y el archivo SQLite existe, no está vacío y tiene la cabecera `SQLite format 3`. | Falla: no hay servidor. |
| AC-03 | `AC-03 sin servidor, la app avisa «No se pudo conectar con el servidor» y ofrece «Reintentar»` (l. 44) | `@EN-001`, `@EN-001-AC-03` | Con `/api/health` interceptado y abortado (servidor que no responde): `role="alert"` con «No se pudo conectar con el servidor», botón accesible «Reintentar» y **cero** apariciones de «Conectado con el servidor». | Falla: no hay página que cargar. |
| AC-04 | `AC-04 al volver el servidor, «Reintentar» quita el aviso y muestra «Conectado con el servidor»` (l. 58) | `@EN-001`, `@EN-001-AC-04` | Primero el aviso de AC-03; luego se deja de interceptar y se pulsa «Reintentar»: aparece `role="status"` con «Conectado con el servidor» y desaparecen el aviso y el botón. | Falla: no hay página que cargar. |
| AC-05 | `AC-05 la pantalla, conectada o con el aviso, no tiene incumplimientos WCAG 2.2 AA` (l. 76) | `@EN-001`, `@EN-001-AC-05` | axe-core con `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` sobre el estado conectado **y** sobre el estado con aviso; cero violaciones en ambos. | Falla: no hay página que cargar. |
| AC-06 | `AC-06 en un celular de 360 px la pantalla se ve completa, sin desplazamiento horizontal` (l. 95) | `@EN-001`, `@EN-001-AC-06` | Viewport 360 × 740: `<h1>` y estado visibles; `documentElement.scrollWidth` y `body.scrollWidth` ≤ `clientWidth` (sin desplazamiento horizontal). | Falla: no hay página que cargar. |
| AC-07 | `specs/EN-001/EN-001.verify` (comando de verificación) | — | `ci/validate.sh` y la sección STACK de `.github/workflows/aes.yml` ejecutan `cargo fmt --check`, `cargo clippy … -D warnings`, `cargo test`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; la CI añade `cargo audit` y `npm audit --audit-level=high`; la suite de Playwright se ejecuta; nada queda silenciado con `|| true` ni `continue-on-error`; y ya no está el ejemplo .NET. | Falla: los dos archivos siguen con el ejemplo .NET y no revisan Rust ni la web del proyecto. |

Trazabilidad: `ci/red-check.mjs` exige que el título empiece por el ID del criterio y que la
prueba lleve `@EN-001-AC-NN`. Se cumple en las 6.

## Pruebas de caracterización

**Ninguna.** EN-001 no cambia un comportamiento existente: crea la app. No hay código previo
que caracterizar y todos los criterios describen comportamiento nuevo. Si alguna prueba
resultara pasar contra la base, sería un error de diseño (o la base ya tendría app), no una
prueba de caracterización.

## Casos negativos y límites

| Caso | Dónde | Qué fija |
|---|---|---|
| Servidor que no responde | AC-03 | Se simula con `page.route('**/api/health', route => route.abort('failed'))`, como indica la fila «Aceptación» del plan. Comprueba también la **ausencia** de «Conectado con el servidor» (no solo la presencia del aviso). |
| Recuperación tras el fallo | AC-04 | El aviso y el botón deben desaparecer con el éxito, no quedar ocultos. Se comprueba `toHaveCount(0)` para el `alert` y para «Reintentar». |
| Primer arranque sin base de datos | AC-02 | El fixture usa una carpeta temporal nueva en cada ejecución y un archivo que no existe; nunca reutiliza una base anterior. |
| Límite de ancho | AC-06 | 360 × 740, el mínimo de `DESIGN.md`. Se mide el desbordamiento real (`scrollWidth`), no una captura. |
| Accesibilidad en los dos estados | AC-05 | El criterio dice «conectada o con el aviso»; se revisan ambos en la misma prueba. |
| API desconocida | — | El contrato fija `404 {"error":{"code":"not_found"}}` para `/api/*` desconocidas, pero **no hay criterio de aceptación aprobado** que lo pida. No se escribe prueba: se propone como criterio nuevo si el humano lo quiere cubierto (ver supuestos). |
| Base de datos caída con el servidor arriba | — | El contrato fija `503 {"error":{"code":"database_unavailable"}}`, pero no hay criterio aprobado ni forma de provocarlo desde fuera. No se prueba en aceptación (ver supuestos). |

Aislamiento de datos (AES 05 §2.5): todas las pruebas comparten el mismo servidor (puerto fijo
del contrato) y por eso la suite usa `workers: 1`, sin `mode: 'serial'`. Ninguna prueba crea
datos de dominio, compara conteos ni depende de otra: AC-02 es la única que mira el archivo de
base de datos y lo hace sobre el archivo temporal propio de la ejecución. Un fallo en una prueba
no impide que se ejecuten las demás.

## RED confirmado

Ejecutado contra el código actual de `qa/EN-001` (base 4b511f5, sin `src/`):

```bash
PLAYWRIGHT_JSON_OUTPUT_NAME="$TEMP/red.json" npm --prefix tests/acceptance test \
  -- --grep "@EN-001(?![\w-])" --reporter=list,json
node ci/red-check.mjs "$TEMP/red.json" EN-001 0 specs/EN-001/EN-001.md
```

Salida literal de `ci/red-check.mjs`:

```text
Historia: @EN-001 | pruebas encontradas: 6 | ejecutadas: 6
  - [failed] AC-01 la app muestra el nombre y «Conectado con el servidor» al abrirla  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
  - [failed] AC-02 el primer arranque sin base de datos crea el archivo y responde que está bien  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
  - [failed] AC-03 sin servidor, la app avisa «No se pudo conectar con el servidor» y ofrece «Reintentar»  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
  - [failed] AC-04 al volver el servidor, «Reintentar» quita el aviso y muestra «Conectado con el servidor»  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
  - [failed] AC-05 la pantalla, conectada o con el aviso, no tiene incumplimientos WCAG 2.2 AA  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
  - [failed] AC-06 en un celular de 360 px la pantalla se ve completa, sin desplazamiento horizontal  →  Error: no se pudo ejecutar «cargo»: spawn cargo ENOENT
Trazabilidad OK: 6 pruebas, todas con un criterio de specs/EN-001/EN-001.md.
RED confirmado: las 6 pruebas de @EN-001 se ejecutaron y fallaron. Revisa arriba que cada una falle por la razón esperada.
```

| Prueba | Resultado | Razón del fallo | ¿Esperada? |
|---|---|---|---|
| AC-01 | failed | El fixture no puede arrancar la app: no hay `src/server` y esta máquina no tiene Rust instalado (`spawn cargo ENOENT`, riesgo ya anotado en el plan técnico). | Sí: sin app no hay página que abrir. |
| AC-02 | failed | Igual: sin servidor no hay `/api/health` ni base de datos que crear. | Sí. |
| AC-03 | failed | Igual: sin servidor no hay página que muestre el aviso. La intercepción de `/api/health` se aplica cuando la página exista. | Sí. |
| AC-04 | failed | Igual. | Sí. |
| AC-05 | failed | Igual: sin página no hay nada que auditar. | Sí. |
| AC-06 | failed | Igual. | Sí. |

En la CI, con o sin Rust instalado, la causa será la misma ausencia del entregable: si `cargo`
existe, `cargo run --manifest-path src/server/Cargo.toml` termina porque el manifiesto todavía
no existe; si el paso de instalación de Rust aún está condicionado a que haya un `Cargo.toml`,
se verá el mismo `ENOENT`. Ninguna prueba falla por un error de su propio código: el fixture
propaga la causa del arranque y la suite no llega a evaluar sus aserciones porque la app aún no
está.

### Comando de verificación de AC-07

`ci/run-verify.sh` lee el `.verify` con `git show <ref>:ruta`, así que necesita que el archivo
esté en una ref. QA no hace commits (lo hace el orquestador), por eso se ejecutó con un índice
temporal que contiene exactamente el entregable, y su árbol como ref:

```bash
GIT_INDEX_FILE="$TEMP/en001-qa-index" git read-tree HEAD
GIT_INDEX_FILE="$TEMP/en001-qa-index" git add tests/acceptance specs/EN-001
tree=$(GIT_INDEX_FILE="$TEMP/en001-qa-index" git write-tree)
bash ci/run-verify.sh red "$tree" specs/EN-001/EN-001.verify
```

Salida literal (recortada a las líneas finales; el detalle completo está en la tabla de AC-07):

```text
── specs/EN-001/EN-001.verify (red)
   │ FALTA: ci/validate.sh: falta «cargo fmt --check» (formato del servidor)
   │ FALTA: ci/validate.sh: falta «cargo clippy … -D warnings» (reglas de estilo del servidor)
   │ FALTA: ci/validate.sh: falta «cargo test» (pruebas del servidor)
   │ FALTA: ci/validate.sh: falta «npm run lint» (formato y estilo de la web)
   │ FALTA: ci/validate.sh: falta «npm run typecheck» (tipos de la web)
   │ FALTA: ci/validate.sh: falta «npm test» (pruebas de la web)
   │ FALTA: ci/validate.sh: falta «npm run build» (compilación de la web)
   │ FALTA: STACK de .github/workflows/aes.yml: falta «cargo fmt --check» (formato del servidor)
   │ FALTA: STACK de .github/workflows/aes.yml: falta «cargo clippy … -D warnings» (reglas de estilo del servidor)
   │ FALTA: STACK de .github/workflows/aes.yml: falta «cargo test» (pruebas del servidor)
   │ FALTA: STACK de .github/workflows/aes.yml: falta «npm run typecheck» (tipos de la web)
   │ FALTA: ci/validate.sh: no condiciona las revisiones del servidor a que exista src/server/Cargo.toml
   │ FALTA: ci/validate.sh: no condiciona las revisiones de la web a que exista src/web/package.json
   │ FALTA: STACK de .github/workflows/aes.yml: no condiciona las revisiones del servidor a que exista src/server/Cargo.toml
   │ FALTA: STACK de .github/workflows/aes.yml: no condiciona las revisiones de la web a que exista src/web/package.json
   │ FALTA: ci/validate.sh: todavía contiene el ejemplo .NET
   │ FALTA: STACK de .github/workflows/aes.yml: todavía contiene el ejemplo .NET
   │ FALTA: STACK de .github/workflows/aes.yml: falta «cargo audit» (dependencias del servidor)
   │ FALTA: STACK de .github/workflows/aes.yml: falta «npm audit --audit-level=high» (dependencias de la web)
   │ AC-07 NO se cumple: la CI todavía no revisa el servidor y la web de este proyecto.
OK   [verify] specs/EN-001/EN-001.verify (código 1)
AES verify (red): OK
```

Cuando el orquestador haga el commit, el mismo comando con `HEAD` dará el mismo resultado.

## Supuestos que requieren decisión

1. **AC-02, «con su estructura».** El contrato solo permite observar la creación de la base por
   dos hechos: `GET /api/health` responde `200 {"status":"ok"}` y el archivo SQLite aparece. La
   prueba comprueba además que el archivo no está vacío y tiene cabecera SQLite. Que las
   migraciones de `src/server/migrations/` se hayan aplicado **no** se puede observar por la
   API (la migración inicial no crea tablas de dominio). Se cubre con las pruebas del servidor,
   no con aceptación. Si el humano quiere una comprobación de estructura en aceptación, hace
   falta un criterio nuevo (por ejemplo, un endpoint de diagnóstico o una regla explícita).
2. **`503 database_unavailable` y `404 not_found` de `/api/*`.** El contrato los define, pero
   ningún criterio aprobado los exige y no hay forma externa de provocar la caída de la base.
   No se escribieron pruebas (toda prueba debe derivarse de un criterio). Propuesta: criterio
   nuevo si se quieren cubrir en aceptación.
3. **Una sola app por ejecución.** AC-02 describe «el servidor arranca por primera vez, sin base
   de datos». El fixture arranca una sola vez por ejecución con una base temporal inexistente;
   la prueba no arranca un segundo servidor. Es lo que fija la fila «Aceptación» del plan
   («las pruebas arrancan la app como un solo servidor»). Si se prefiere un arranque dedicado
   por prueba, hay que cambiar el contrato de aceptación y el puerto.
4. **AC-05 en una sola prueba para los dos estados.** El criterio admite «conectada o con el
   aviso»; se revisan los dos en la misma prueba para no duplicar el criterio. Si el humano
   prefiere una prueba por estado, se dividen sin cambiar el criterio (pero cada una seguiría
   etiquetada `@EN-001-AC-05`).
5. **Medida de AC-06.** «La pantalla se ve completa, sin desplazamiento horizontal» se mide como
   `documentElement.scrollWidth` y `body.scrollWidth` ≤ `clientWidth` en 360 × 740, no con
   comparación visual. Un elemento decorativo fuera de pantalla que no genere scroll no se
   detecta; se acepta porque el criterio habla de desplazamiento.
6. **Textos exactos.** Las aserciones comparan literalmente «aes-todo», «Conectado con el
   servidor», «No se pudo conectar con el servidor» y «Reintentar», con las mayúsculas y los
   signos del contrato. El estado intermedio «Conectando…» no se prueba porque ningún criterio
   lo exige (solo está en el contrato de UI).
7. **Nombre accesible del botón.** Se exige un `<button>` cuyo nombre accesible sea exactamente
   «Reintentar». Si la implementación usa otro elemento con `role="button"`, la prueba falla
   aunque el contrato dice `<button>`.
8. **AC-07 comprueba la forma de la CI, no su eficacia.** El comando verifica que los comandos
   acordados estén en `ci/validate.sh` y en la sección STACK, que las auditorías estén solo en
   la CI y que no haya `|| true` ni `continue-on-error` en STACK. No puede demostrar que un
   fallo real ponga la CI en rojo sin romper el repositorio a propósito; eso lo garantiza el
   propio flujo de GitHub Actions (un paso que termina distinto de 0 falla).
9. **Rutas de los proyectos.** El comando asume `src/server/Cargo.toml` y `src/web/package.json`,
   las rutas del plan. Si el humano cambia la estructura, hay que actualizar el plan y el
   `.verify` a la vez.
10. **Entorno local sin Rust.** El RED local es «de arranque» porque esta máquina no tiene
    `cargo` (riesgo del plan técnico). La CI, que sí lo instala, reproducirá el RED por la
    ausencia del manifiesto. Cuando TASK-001 cree el servidor, el programador debe ver que cada
    prueba falla por su propio motivo (por ejemplo, AC-01 con la página 404 o sin el `<h1>`) y
    no por el arranque; si no, debe reportarlo en vez de tocar las pruebas.
