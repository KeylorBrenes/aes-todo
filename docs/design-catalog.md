# Catálogo de diseño — aes-todo

Memoria de diseño del proyecto (10 §6). Lo consulta el orquestador antes de cada nota de diseño y lo actualiza en el cierre de cada elemento.

## Patrones en uso (nivel 2)
| Patrón | Dónde | Razón presente | Desde (elemento / ADR) |
|---|---|---|---|
| Capas `http` / `store` en el servidor (`domain` cuando haya reglas) | `src/server/src/http/`, `src/server/src/store/` | ADR-001 y `docs/architecture.md`: el dominio no depende de Axum ni de SQLx | EN-001 |
| `ApiError` como único productor del cuerpo de error `{"error":{"code","message"}}` | `src/server/src/http/error.rs` | Contrato uniforme de la API; códigos en uso: `not_found` (404), `method_not_allowed` (405), `database_unavailable` (503) | EN-001 |
| Fallbacks del router de `/api`: ruta explícita `/api/` y `method_not_allowed_fallback` | `src/server/src/http/mod.rs` | `nest("/api")` no cubre la barra final, y Axum responde 405 sin cuerpo por defecto | EN-001 |
| Estado de petición con tres valores (`checking` / `ok` / `error`) en el componente dueño | `src/web/src/App.tsx` | Una sola pantalla y una sola llamada | EN-001 |
| Un módulo por llamada a la API, única pieza que conoce URL y forma de la respuesta | `src/web/src/api/` | Separar la entrada/salida de la presentación | EN-001 |
| Textos de la interfaz en un catálogo | `src/web/src/i18n/es.ts` | Perfil: textos en catálogos desde el principio; la biblioteca de i18n se elige en US-005 | EN-001 |
| Región viva única: un solo `role="status"` siempre montado cuyo texto cambia; el aviso de error en un `role="alert"` aparte, con su botón como hermano | `src/web/src/App.tsx` | Un lector de pantalla no siempre anuncia una región viva que se inserta ya con texto (WCAG 4.1.3); el `alert` no debe contener el control | EN-001 |
| Gestión del foco tras una acción que desmonta su control: el foco va al elemento de estado (`tabIndex={-1}`) **en el manejador del evento, antes del render** que desmonta el control; si la acción falla, vuelve al control; si funciona, se queda en el estado | `src/web/src/App.tsx` | Si se espera al efecto, el foco ya cayó a `body` (WCAG 2.4.3) | EN-001, ST-001 |
| Elemento de estado vacío fuera del flujo con una clase de ocultación visual (`status-empty`: absoluto, 1 px, `clip-path`), sin desmontarlo | `src/web/src/App.tsx`, `src/web/src/styles.css` | No suma `gap` y sigue en el árbol de accesibilidad para anunciar el siguiente texto | ST-001 |

## Decidido no usar
| Patrón o abstracción | Motivo | Señal que haría reconsiderarlo | Desde |
|---|---|---|---|
| Trait de repositorio o de «health checker» | Una sola implementación | Una segunda fuente de datos o pruebas que necesiten sustituir el almacén | EN-001 |
| Tipo de error global de la app con variantes «por si acaso» | `ApiError` solo construye lo que la API responde hoy | Errores de dominio que crucen varias capas (US-001) | EN-001 |
| Macros `query!` de SQLx | Exigen base de datos en tiempo de compilación. La feature `macros` sí se activa, porque `sqlx::migrate!` la necesita | Consultas complejas donde la comprobación en compilación compense el costo en la CI | EN-001 |
| `dotenvy` / archivos `.env` | La configuración entra por variables de entorno leídas solo en `main` | Un despliegue que no permita variables de entorno (SP-001) | EN-001 |
| Cliente HTTP genérico, `useFetch`, React Query | Una sola llamada | Tres o más llamadas con carga, error y reintento repetidos | EN-001 |
| Componentes reutilizables `Button`, `Card`, `Alert` | Una sola pantalla | La segunda pantalla con los mismos elementos (US-001) | EN-001 |
| Enrutador, contexto o estado global | Una sola pantalla sin sesión | Sesión de usuario (US-002) o una segunda ruta | EN-001 |
| Anillo de foco propio por tipo de elemento (p. ej. neutro para elementos de estado) | `DESIGN.md` define un solo anillo; decisión del responsable del producto en BUG-001 | Un cambio de la dirección visual | ST-001 |
| `display: none`, `hidden` o `:empty` para ocultar una región viva vacía | Las dos primeras la sacan del árbol de accesibilidad; `:empty` depende de que React no cree un nodo de texto | — | ST-001 |
| Hook de foco (`useFocus…`) o componente `<Status>` | Una sola pantalla | La segunda pantalla con estado y reintento | ST-001 |

## Cómo se aplica el nivel 1 en este proyecto
- **Configuración:** `Config::from_env()` se lee una vez en `main` y se pasa por parámetro; ningún otro módulo lee variables de entorno. `AppState` lleva lo que los handlers y el router necesitan (`pool` y `web_dist`).
- **Acceso a datos:** solo `store/` conoce `SqliteConnectOptions` y el SQL; los handlers de `http/` llaman a funciones de `store`.
- **Pruebas del servidor:** `http::app(state)` con `tower::ServiceExt::oneshot`, sin abrir puertos, con base SQLite temporal (`tempfile`).
- **Web:** los componentes no llaman a `fetch`; usan el módulo de `src/web/src/api/`. Sin estilos en línea ni textos en el JSX.
- **Foco:** un solo anillo para todo, la regla global `:focus-visible` de 3 px `--action` con `outline-offset: 2px` (`DESIGN.md`), también para el elemento de estado enfocado por programa; con ratón no se dibuja (`:focus:not(:focus-visible) { outline: none }`). Ningún elemento define su propio anillo.

## Reglas del nivel 1 cubiertas por la CI
| Regla | Herramienta y configuración |
|---|---|
| Formato del servidor | `cargo fmt --check` |
| Sin `unwrap`/`expect` fuera de pruebas | `[lints.clippy] unwrap_used = "deny"`, `expect_used = "deny"`; `clippy.toml` los permite en pruebas |
| Lints del servidor | `cargo clippy --all-targets --locked -- -D warnings` |
| Tipos y lint de la web | `tsc --noEmit` (estricto, `noUncheckedIndexedAccess`); ESLint con `typescript-eslint` `strict` y `react-hooks` |
| Dependencias | `cargo audit`; `npm audit --audit-level=high` |
| Accesibilidad de cada pantalla | axe en la aceptación (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) |
