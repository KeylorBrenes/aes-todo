# TASK-001 — El servidor arranca, crea su base de datos y responde su estado

- **Historia/Enabler/Bug/Lote:** EN-001
- **Track:** T2
- **Estado:** Ready
- **Agente asignado:** programador
- **Riesgo:** Low
- **Ciclos FAIL acumulados:** 0 / 3

## Objetivo y resultado esperado
Un binario Rust que, al arrancar, crea (si no existe) el archivo SQLite de `DATABASE_URL`, activa WAL, aplica las migraciones y sirve `GET /api/health` según el contrato de `specs/EN-001/plan.md`.

## Alcance
- Crate nuevo en `src/server/` (edición 2024) con `Cargo.toml` y `Cargo.lock` versionados.
- `GET /api/health`, 404 uniforme bajo `/api/`, y la entrega de archivos de `WEB_DIST` con `index.html` de respaldo (si la carpeta no existe, el servidor arranca igual).
- Migración `src/server/migrations/0001_init.sql`, sin tablas de dominio.
- Pruebas de integración en `src/server/tests/`.

## Fuera de alcance
- La web (`src/web/`): es TASK-002.
- Cuenta, sesión, tareas, tablas de dominio: US-001 en adelante.
- CORS, compresión, límites de tasa, cabeceras de seguridad, registros estructurados con formato propio.
- Apagado elegante con señales, configuración por archivo, líneas de comando con argumentos.

## Criterios que deja en verde
`specs/EN-001/TASK-001.criteria`: AC-02.

## Contexto técnico
- ADR-001 (Axum 0.8, Tokio, SQLx con SQLite en WAL, migraciones al arrancar).
- `docs/architecture.md`: `http` → `domain` ← `store`; el dominio no depende de Axum ni de SQLx; errores `{"error":{"code","message"}}`.
- Contrato: `specs/EN-001/plan.md`, filas API, Servidor y Configuración.

## Superficie de cambio
`specs/EN-001/TASK-001.scope`.

## Restricciones y permisos
Dependencias autorizadas (y ninguna otra; versiones estables actuales): `axum` 0.8, `tokio` (features `macros`, `rt-multi-thread`, `net`), `sqlx` (features `runtime-tokio`, `sqlite`, `migrate`; sin `macros` de consulta en tiempo de compilación), `tower-http` (feature `fs`), `serde` (feature `derive`), `serde_json`, `tracing`, `tracing-subscriber`. Solo para pruebas (`[dev-dependencies]`): `tower` (feature `util`), `http-body-util`, `tempfile`. El humano las aprueba con `aes:deps-approved`.

## Nota de diseño

### Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| `src/server/Cargo.toml` | Nueva | Declarar el paquete `aes-todo-server` (lib + bin `aes-todo`), dependencias y `[lints.clippy] unwrap_used = "deny"`, `expect_used = "deny"` |
| `src/server/clippy.toml` | Nueva | `allow-unwrap-in-tests = true` y `allow-expect-in-tests = true` |
| `src/server/src/main.rs` | Nueva | Leer `Config`, abrir la base, construir el router y servir en `APP_ADDR`; un error de arranque se imprime y termina con código distinto de 0 |
| `src/server/src/lib.rs` | Nueva | Declarar los módulos `config`, `http`, `store` y reexportar `app(state)` |
| `src/server/src/config.rs` — `Config::from_env()` | Nueva | Leer `DATABASE_URL`, `APP_ADDR`, `WEB_DIST` con sus valores por defecto |
| `src/server/src/store/mod.rs` — `open(url) -> Result<SqlitePool, sqlx::Error>` | Nueva | Crear el archivo si falta (`create_if_missing(true)`), WAL, y `sqlx::migrate!("./migrations")` |
| `src/server/src/store/mod.rs` — `ping(&SqlitePool) -> Result<(), sqlx::Error>` | Nueva | Ejecutar `SELECT 1` |
| `src/server/src/http/mod.rs` — `app(AppState) -> Router` | Nueva | Montar `/api/health`, el 404 de `/api/*` y el `ServeDir` de `WEB_DIST` con `ServeFile(index.html)` de respaldo |
| `src/server/src/http/health.rs` — `health` | Nueva | Responder 200 `{"status":"ok"}` si `ping` va bien, 503 `database_unavailable` si no |
| `src/server/src/http/error.rs` — `ApiError { status, code, message }` + `IntoResponse` | Nueva | Producir el cuerpo uniforme `{"error":{"code","message"}}` |
| `src/server/migrations/0001_init.sql` | Nueva | Migración inicial sin tablas (un comentario y `SELECT 1;`) |
| `src/server/tests/health.rs` | Nueva | Integración: base temporal nueva → archivo creado, migración aplicada (`_sqlx_migrations` con 1 fila), 200 `ok`; pool cerrado → 503 con el cuerpo de error; `/api/nada` → 404 uniforme |

`AppState { pool: SqlitePool }` vive en `http/mod.rs`, con `#[derive(Clone)]`.

### Patrón (nivel 2)
**Ninguno.** Hay una sola ruta y un solo almacén; el código directo basta.

### Lo que no se hace
- No se crea el módulo `domain`: EN-001 no tiene reglas de negocio; llega con US-001.
- No se crea un trait de repositorio ni de «health checker»: una sola implementación.
- No se crea un tipo de error global de la app con variantes «por si acaso»: `ApiError` solo construye lo que la API responde hoy.
- No se usan las macros `query!` de SQLx (exigen base en tiempo de compilación).
- No se agrega `dotenvy` ni lectura de archivos `.env`.
- No se hace reintento de conexión a la base al arrancar.

### Nivel 1 donde no es obvio
- La entrada/salida termina en `http/`: los handlers reciben `State<AppState>` y llaman a `store::ping`; no hay SQL en `http/`.
- `store::open` es lo único que conoce `SqliteConnectOptions`; `main` le pasa la URL de `Config`.
- `Config` se lee una vez en `main` y se pasa por parámetro; ningún otro módulo lee variables de entorno.
- Las pruebas usan `http::app(state)` con `tower::ServiceExt::oneshot`, sin abrir puertos.

### ¿Cambia el catálogo de diseño?
Sí: capas `http` / `store` (y `domain` cuando haya reglas), `ApiError` como único productor del cuerpo de error, `Config` leída solo en `main`.

## Estados que introduce
Ninguno de interfaz.

## Dependencias
Ninguna tarea previa.

## Comandos de validación exactos
```
cargo fmt --manifest-path src/server/Cargo.toml --check
cargo clippy --manifest-path src/server/Cargo.toml --all-targets --locked -- -D warnings
cargo test --manifest-path src/server/Cargo.toml --locked
bash ci/validate.sh
npm --prefix tests/acceptance test -- --grep "@EN-001-AC-02(?![\w-])"
```

## Pruebas de regresión afectadas (test map)
Ninguna (no hay código previo).

## Presupuesto de diff orientativo
- Producción: ~180 líneas (sin `Cargo.lock`)
- Pruebas: ~90 líneas

## Condición de finalización
`ci/validate.sh` en verde, la aceptación de AC-02 en verde y el reporte con la salida de los comandos.
