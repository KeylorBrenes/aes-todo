# Catálogo de diseño — aes-todo

Memoria de diseño del proyecto (10 §6). Lo consulta el orquestador antes de cada nota de diseño y lo actualiza en el cierre de cada elemento.

## Patrones en uso (nivel 2)
| Patrón | Dónde | Razón presente | Desde (elemento / ADR) |
|---|---|---|---|
| Capas `http` / `store` / `domain` en el servidor | `src/server/src/http/`, `src/server/src/store/`, `src/server/src/domain/` | ADR-001 y `docs/architecture.md`: el dominio no depende de Axum ni de SQLx. `domain` existe desde US-001 (reglas de usuario y contraseña, hash, token) | EN-001, US-001 |
| `ApiError` como único productor del cuerpo de error `{"error":{"code","message"}}`, con `fields` opcional | `src/server/src/http/error.rs` | Contrato uniforme de la API. Códigos en uso: `not_found` (404), `method_not_allowed` (405), `database_unavailable` (503), `validation_failed` (400, con `fields` por campo), `invalid_body` (400), `account_exists` (409) e `internal` (500) | EN-001, US-001 |
| Cuerpo JSON recibido como `Result<Json<T>, JsonRejection>`, y cualquier rechazo traducido a `invalid_body` | `src/server/src/http/account.rs` | Axum responde 400, 415 o 422 en texto plano por defecto, fuera del contrato | US-001 |
| «Una sola fila» garantizada por la base: clave fija `id INTEGER PRIMARY KEY CHECK (id = 1)` y el error de clave duplicada traducido a 409. Sin consulta previa | `src/server/migrations/0002_account.sql`, `src/server/src/store/account.rs` | Regla «una sola cuenta», atómica también con peticiones simultáneas (12 a la vez: un 201 y once 409) | US-001 |
| Sesión por cookie `aes_session` (`HttpOnly; SameSite=Strict; Path=/`, sin caducidad hasta US-003), valor aleatorio de 32 bytes; en la base solo su SHA-256 | `src/server/src/domain/session.rs`, `src/server/src/http/session_cookie.rs` | Sesión por navegador hasta cerrar sesión (brief). `Secure` llega con HTTPS (EN-003) | US-001 |
| Contraseña solo como hash Argon2id (formato PHC), calculado en `spawn_blocking` | `src/server/src/domain/account.rs`, `src/server/src/http/account.rs` | Brief (Argon2id); el hash bloquea decenas de ms | US-001 |
| Reglas de entrada duplicadas en el cliente y el servidor, con el mismo conteo de caracteres (puntos de código Unicode) | `src/web/src/accountRules.ts`, `src/server/src/domain/account.rs` | El cliente da los errores sin llamar a la API; el servidor es la garantía | US-001 |
| Elemento de resultado enfocado tras un cambio de vista asíncrono: `tabIndex={-1}`, foco en un `useEffect` **solo si el cambio vino del formulario** (ref de origen); al recargar no se mueve | `src/web/src/App.tsx` | El control que se envió se desmonta al terminar la petición (WCAG 2.4.3) | US-001 |
| Errores por campo como descripción accesible (`aria-describedby` con solo los ids presentes, `aria-invalid`); el foco va al primer campo con error; sin región viva | `src/web/src/CreateAccountForm.tsx` | D-06; el error se lee al recibir el foco | US-001 |
| Indicador de ayuda como descripción del campo, no como región viva | `src/web/src/CreateAccountForm.tsx` | Una región viva se anunciaría en cada tecla | US-001 |
| Botón de acción `.action-button` y botón secundario `.secondary-button` | `src/web/src/styles.css` | Dos botones en la misma pantalla (antes `.retry`) | US-001 |
| Pruebas de aceptación con un servidor y una base nuevos por prueba cuando el elemento depende del estado de la base | `tests/acceptance/fixtures/app.ts` | US-001 necesita «sin cuenta» en cada prueba | US-001 |
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
| `axum-extra` u otra biblioteca de cookies | Leer una cookie y escribir un `Set-Cookie` son pocas líneas | Varias cookies o atributos que cambien por entorno (EN-003) | US-001 |
| `chrono`, `time` o `uuid` | SQLite pone las fechas (`DEFAULT strftime(…)`) y la cuenta tiene clave fija | Fechas calculadas en el dominio (US-008, inicio de una tarea) | US-001 |
| Traits de «hasher» o de generador de tokens | Una sola implementación | Pruebas que necesiten un hash determinista | US-001 |
| Biblioteca de formularios o de validación (`react-hook-form`, `zod`) y componentes `Field` o `PasswordInput` | Un formulario de tres campos | El formulario de inicio de sesión (US-002) con los mismos campos | US-001 |
| `--danger` en los errores de un formulario | `DESIGN.md` lo reserva para la papelera; el error va en `--ink` 600 y el campo con borde de 2 px `--ink` | Un cambio de la dirección visual | US-001 |
| `disabled` en un botón de envío en curso | Pierde el foco; se ignora el segundo envío con una ref | — | US-001 |
| `aria-pressed` en un botón cuyo nombre cambia («Mostrar» / «Ocultar») | Combinar los dos confunde al lector de pantalla | — | US-001 |

## Huecos conocidos (para la próxima nota que toque la zona)
| Hueco | Dónde | Qué decidir | Desde |
|---|---|---|---|
| Con la cuenta ya creada, `POST /api/account` calcula el hash Argon2id (unos 19 MiB, decenas de ms) antes de responder 409 | `src/server/src/http/account.rs` | Antes de EN-003: un límite de peticiones o una comprobación barata previa (la clave fija sigue siendo la garantía) | US-001 (F-2 de TASK-001) |
| Un `invalid` del servidor con `fields` vacío o con claves desconocidas no muestra ningún error ni aviso en el formulario | `src/web/src/CreateAccountForm.tsx` | Mostrar el aviso de fallo general; hoy no ocurre, porque el servidor siempre indica el campo | US-001 (verificación de TASK-002) |
| Las pruebas que cuentan elementos globales (migraciones, rutas) o cuyo camino depende del componente que cambia rompen tareas que no las tienen en la superficie | Notas de diseño | Incluirlas en la superficie al escribir la nota (FL-006) | US-001 |

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
