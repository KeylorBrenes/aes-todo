# TASK-002 — El servidor entrega la página, que muestra si está conectada

- **Historia/Enabler/Bug/Lote:** EN-001
- **Track:** T2
- **Estado:** Ready
- **Agente asignado:** programador
- **Riesgo:** Low
- **Ciclos FAIL acumulados:** 0 / 3

## Objetivo y resultado esperado
Una web React + TypeScript + Vite en `src/web/` que, compilada y entregada por el servidor de TASK-001, muestra el nombre de la app y su estado de conexión (conectando, conectado, sin conexión con «Reintentar») según el contrato UI de `specs/EN-001/plan.md`, con la base visual de `DESIGN.md`, accesible (WCAG 2.2 AA) y usable desde 360 px.

## Alcance
- Proyecto web nuevo en `src/web/` con los scripts `dev`, `build`, `lint`, `typecheck` y `test`, y `package-lock.json` versionado.
- La pantalla única con sus tres estados y sus pruebas con Vitest.
- Proxy de Vite de `/api` a `http://127.0.0.1:5080` para desarrollo (puerto 5173, ver `.claude/aes.env`).

## Fuera de alcance
- Cambios en `src/server/` (TASK-001 ya entrega `WEB_DIST`).
- Modo oscuro (US-022): solo se definen los tokens claros; no se agrega `prefers-color-scheme`.
- Biblioteca de i18n (US-005), enrutador, gestor de estado global, biblioteca de componentes, React Query, Tailwind.
- Reintento automático, sondeo periódico del estado, spinner animado.
- Barra inferior, tarjetas de tareas y cualquier otro elemento de `DESIGN.md` que no sea fondo, tarjeta, tipografía, botón y foco.

## Criterios que deja en verde
Última tarea del elemento: sin `.criteria`; la CI ejecuta todos los criterios de EN-001.

## Contexto técnico
- ADR-001 (React + TS + Vite; Vitest; ESLint; `tsc --noEmit`).
- `DESIGN.md`: tokens `--ground`, `--surface`, `--ink`, `--ink-muted`, `--line`, `--action`, `--on-action`; fuente Nunito; radios y tamaños de toque.
- Perfil: ESLint con `@typescript-eslint/strict`; textos de la interfaz en catálogos.

## Superficie de cambio
`specs/EN-001/TASK-002.scope`.

## Restricciones y permisos
Dependencias autorizadas (versiones estables actuales), y ninguna otra: `react` 19, `react-dom` 19, `@fontsource/nunito`. De desarrollo: `vite`, `@vitejs/plugin-react`, `typescript` 5, `@types/react`, `@types/react-dom`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`. El humano las aprueba con `aes:deps-approved`. Nada se carga desde una CDN ni desde Google Fonts.

## Nota de diseño

### Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| `src/web/package.json` (+ `package-lock.json`) | Nueva | Declarar dependencias y los scripts `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`) |
| `src/web/vite.config.ts` | Nueva | Plugin de React, proxy `/api` → `http://127.0.0.1:5080`, y la configuración de Vitest (`jsdom`, archivo de preparación) |
| `src/web/tsconfig.json` | Nueva | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`) |
| `src/web/eslint.config.js` | Nueva | `@eslint/js` recomendado + `typescript-eslint` `strict` + `react-hooks` |
| `src/web/index.html` | Nueva | `<html lang="es">`, `<title>aes-todo</title>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, raíz de React |
| `src/web/src/main.tsx` | Nueva | Importar la fuente y los estilos, y montar `<App />` |
| `src/web/src/App.tsx` — `App` | Nueva | Mostrar `<main>`, el `<h1>` y el estado de conexión; gestionar el estado `"checking" \| "ok" \| "error"` |
| `src/web/src/api/health.ts` — `checkHealth(): Promise<boolean>` | Nueva | Hacer `fetch("/api/health")` y devolver `true` solo con 2xx y `status === "ok"`; cualquier excepción devuelve `false` |
| `src/web/src/i18n/es.ts` — `texts` | Nueva | Catálogo de textos en español (`appName`, `checking`, `connected`, `disconnected`, `retry`), `as const` |
| `src/web/src/styles.css` | Nueva | Tokens claros de `DESIGN.md` como variables CSS en `:root` y los estilos de la pantalla |
| `src/web/src/App.test.tsx` | Nueva | Vitest con `fetch` simulado: conectando → conectado; error de red → aviso y botón; respuesta 503 → aviso; «Reintentar» con éxito → conectado sin aviso |
| `src/web/src/test-setup.ts` | Nueva | Registrar `@testing-library/jest-dom` |

### Patrón (nivel 2)
**Ninguno.** Una pantalla con un estado local (`useState` + `useEffect`); no hay variantes que justifiquen un hook propio, un contexto o un cliente HTTP genérico.

### Lo que no se hace
- No se crea un cliente HTTP genérico ni un `useFetch`: una sola llamada.
- No se crea un componente `Button`, `Card` o `Alert` reutilizable: se generaliza cuando una segunda pantalla lo pida (US-001).
- No se agrega un `ErrorBoundary`, enrutador, contexto ni estado global.
- No se escriben textos en el JSX: todos vienen de `texts`.
- No se usa `dangerouslySetInnerHTML` ni estilos en línea.
- No se agrega modo oscuro ni selector de tema.

### Nivel 1 donde no es obvio
- `App` no llama a `fetch` directamente: usa `checkHealth()`, que es la única pieza que conoce la URL y la forma de la respuesta.
- El estado de petición vive en `App`: lo crea la carga inicial (`"checking"`), lo cambia el resultado de `checkHealth` (`"ok"` o `"error"`) y lo vuelve a `"checking"` el clic en «Reintentar».
- Estado «Conectando…» y «Conectado con el servidor» en un elemento con `role="status"`; el aviso en un elemento con `role="alert"` que contiene el texto y el `<button type="button">`. En el estado `"ok"` el aviso no se renderiza.
- Estilos: fondo de la página `--ground`; el contenido en una tarjeta `--surface` centrada, con ancho máximo y `padding` relativo para que a 360 px no haya desplazamiento horizontal; botón con fondo `--action`, texto `--on-action`, alto mínimo de 44 px; foco visible con `outline` de `--action` (`:focus-visible`). Fuente `"Nunito", system-ui, sans-serif` desde `@fontsource/nunito`.

### ¿Cambia el catálogo de diseño?
Sí: estado de petición con tres valores en el componente dueño; un módulo por llamada a la API en `src/web/src/api/`; textos en `src/web/src/i18n/es.ts`; «no» a componentes reutilizables hasta la segunda pantalla.

## Estados que introduce
| Estado | Lo crea | Lo limpia |
|---|---|---|
| `checking` («Conectando…») | Montar la página; clic en «Reintentar» | Resultado de `checkHealth` |
| `ok` («Conectado con el servidor») | `checkHealth` devuelve `true` | — (no hay sondeo; recargar la página) |
| `error` (aviso + «Reintentar») | `checkHealth` devuelve `false` | Clic en «Reintentar» (pasa a `checking`) |

## Dependencias
TASK-001 integrada en `dev`.

## Comandos de validación exactos
```
npm --prefix src/web ci
npm --prefix src/web run lint
npm --prefix src/web run typecheck
npm --prefix src/web test
npm --prefix src/web run build
bash ci/validate.sh
npm --prefix tests/acceptance test -- --grep "@EN-001(?![\w-])"
```

## Pruebas de regresión afectadas (test map)
`src/server/tests/health.rs` y las pruebas de aceptación de `@EN-001-AC-02`.

## Presupuesto de diff orientativo
- Producción: ~200 líneas (sin `package-lock.json`)
- Pruebas: ~90 líneas

## Condición de finalización
`ci/validate.sh` en verde, toda la aceptación de `@EN-001` en verde y el reporte con la salida de los comandos.
