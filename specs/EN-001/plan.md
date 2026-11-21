# Plan técnico — EN-001

- **Historia:** [EN-001](EN-001.md)
- **Resumen estructural usado:** N/A — `origin/dev` (4b511f5) no tiene código de aplicación todavía.

## Contrato de interfaz
| Tipo | Definición |
|---|---|
| API | `GET /api/health` → `200 {"status":"ok"}` si la base de datos responde a una consulta; si no, `503 {"error":{"code":"database_unavailable","message":"<texto>"}}`. |
| API | Cualquier otra ruta bajo `/api/` → `404 {"error":{"code":"not_found","message":"<texto>"}}`. Cuerpo de error uniforme `{"error":{"code","message"}}` para toda la API. |
| Servidor | Cualquier ruta fuera de `/api/` → archivos de la web compilada; si no existe el archivo, `index.html` (la web es una sola página). Si la carpeta de la web no existe, el servidor arranca igual y esas rutas responden 404. |
| Configuración | Variables de entorno: `DATABASE_URL` (URL de SQLx, p. ej. `sqlite:C:/tmp/x.db`; por defecto `sqlite:aes-todo.db`), `APP_ADDR` (por defecto `127.0.0.1:5080`), `WEB_DIST` (carpeta de la web compilada; por defecto `src/web/dist`). Si el archivo de la base no existe, el servidor lo crea, activa WAL y aplica las migraciones de `src/server/migrations/` antes de aceptar conexiones. |
| UI | `<html lang="es">`, `<title>aes-todo</title>`. Un `<main>` con `<h1>aes-todo</h1>`. |
| UI | Al cargar, la página hace **una** llamada a `GET /api/health`. Mientras espera: `role="status"` con «Conectando…». Con `200` y `status: "ok"`: `role="status"` con «Conectado con el servidor». Con cualquier otra respuesta o error de red: `role="alert"` con «No se pudo conectar con el servidor» y un `<button>` con nombre accesible «Reintentar»; en ese estado no aparece «Conectado con el servidor». |
| UI | «Reintentar» vuelve a «Conectando…» y repite la llamada; el resultado decide el estado como arriba. El aviso y el botón desaparecen con el éxito. |
| Aceptación | Las pruebas arrancan la app como un solo servidor en `http://127.0.0.1:5080`: compilan la web (`npm --prefix src/web run build`) **solo si existe `src/web/package.json`** (TASK-001 no tiene web), y ejecutan `cargo run --locked --manifest-path src/server/Cargo.toml` con `DATABASE_URL` apuntando a un archivo **que no existe** dentro de una carpeta temporal, `APP_ADDR=127.0.0.1:5080` y `WEB_DIST=<repo>/src/web/dist`. Listo cuando `GET /api/health` responde. AC-03/AC-04 se simulan interceptando `/api/health` en el navegador. AC-05 usa axe con las etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. AC-06 usa un viewport de 360 × 740. |
| CI (AC-07) | `ci/validate.sh` y la sección STACK de `.github/workflows/aes.yml` ejecutan, si existen `src/server/Cargo.toml` y `src/web/package.json`: `cargo fmt --check`, `cargo clippy --all-targets --locked -- -D warnings`, `cargo test --locked`; `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Solo la CI ejecuta además `cargo audit` y `npm audit --audit-level=high`. |

## Corte vertical
- **Base de datos:** archivo SQLite creado al arrancar, WAL, una migración inicial `0001_init.sql` sin tablas de dominio (las cuentas llegan con US-001); existe para que el mecanismo de migraciones quede probado.
- **Servidor:** binario Axum con `GET /api/health`, el 404 uniforme de `/api/*` y la entrega de la web.
- **Web:** una pantalla con los tres estados (conectando, conectado, sin conexión), con la base visual de `DESIGN.md` (fondo `--ground`, tarjeta `--surface`, Nunito servida localmente, foco con `--action`).
- **CI:** la sección STACK y `ci/validate.sh` para Rust y Node (la hace el orquestador en este PR, porque son rutas protegidas).

## Tareas (3 como máximo, 04 §3)
| ID | Resultado | Criterios que deja en verde | Superficie | Agente |
|---|---|---|---|---|
| TASK-001 | El servidor arranca, crea su base de datos y responde su estado | AC-02 | `TASK-001.scope` | programmer |
| TASK-002 | El servidor entrega la página, que muestra si está conectada | Todos (última tarea) | `TASK-002.scope` | programmer |

## Riesgos técnicos y preguntas abiertas
- Rust no está instalado en la máquina local; la implementación espera a que el humano lo instale.
- La primera compilación de Rust en la CI es lenta; se usa caché.

## Para consolidar en el cierre
- Catálogo de diseño: capas `http` / `domain` / `store` del servidor; cuerpo de error uniforme; textos de la web en un catálogo (`src/web/src/i18n/es.ts`) hasta que US-005 elija biblioteca; estado de petición con tres valores en la web.
- ADR: ninguno (las convenciones ya están en ADR-001 y en la arquitectura).
