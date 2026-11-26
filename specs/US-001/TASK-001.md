# TASK-001 — La cuenta única se crea con su sesión y la app muestra quién está dentro

- **Historia:** US-001
- **Track:** T2
- **Estado:** Ready
- **Agente asignado:** programmer
- **Nivel de modelo:** alto — seguridad (Argon2id, token de sesión, cookie) y concurrencia de la regla «una sola cuenta»
- **Datos que ve el rol:** solo código
- **Riesgo:** Alto
- **Ciclos FAIL acumulados:** 0 / 3

## Objetivo y resultado esperado
Con la base vacía, el formulario «Crear la cuenta» crea la única cuenta y deja al dueño dentro con su sesión («Sesión iniciada como <usuario>»), también al recargar. Con la cuenta creada, nadie puede crear otra, ni por la pantalla ni por la API, ni con dos intentos a la vez.

## Alcance
- Servidor: migración `0002`, reglas de usuario y contraseña, hash Argon2id, token de sesión, `GET /api/session`, `POST /api/account`, códigos de error nuevos y sus pruebas.
- Web: módulos de API de sesión y de cuenta, formulario básico (encabezado, tres campos con etiqueta, «Crear cuenta») y los estados «La cuenta ya está creada.» y «Sesión iniciada como <usuario>».

## Fuera de alcance
- En la web: «Mostrar contraseña», el indicador de largo, los errores por campo, la comprobación de que las dos contraseñas coinciden y el aviso de fallo: son de TASK-002. En esta tarea, un resultado `invalid` o `failed` de `createAccount` no cambia la pantalla.
- Inicio de sesión con formulario, cierre de sesión, caducidad de la sesión y límite de intentos (US-002, US-003).
- No se toca `http/health.rs` ni `api/health.ts`, y la línea de estado y el aviso de conexión de EN-001 siguen igual.
- En `src/server/tests/health.rs` solo cambia la aserción del número de migraciones aplicadas (enmienda del 2026-11-25, tras el BLOCKED del primer intento): se compara con el total de migraciones del proyecto, `sqlx::migrate!("./migrations").iter().count()`, no con un número fijo, para que la próxima migración no la rompa. El resto del archivo no cambia.
- No se agrega `Secure` a la cookie (EN-003).

## Criterios que pone en verde
`TASK-001.criteria`: AC-02, AC-05. Además, la CI ejecuta `specs/US-001/US-001.verify` (AC-07) en esta tarea y tiene que pasar.

## Contexto técnico
- Contrato: `specs/US-001/plan.md` (API, cookie, reglas, pantalla). Es la fuente de los nombres, los códigos y los textos.
- Catálogo: `docs/design-catalog.md` (capas `http` / `store` / `domain`, `ApiError`, fallbacks de `/api`, un módulo por llamada a la API, textos en `i18n/es.ts`, foco).
- ADR-001 (stack). Perfil: Argon2id; fechas UTC fijadas por el servidor; errores `{"error":{"code","message"}}`.

## Superficie de cambio
Publicada en `specs/US-001/TASK-001.scope`.

## Restricciones y permisos
- **Dependencias autorizadas** (servidor, sin otras): `argon2` 0.5, `sha2` 0.10, `base64` 0.22, `getrandom` 0.3. Requieren `aes:deps-approved` del humano. En la web no hay dependencias nuevas.
- Supresiones (`nosemgrep`, `#[allow]`, `eslint-disable`) solo con aprobación humana.
- Aplicar la skill `aes-security-review` antes de entregar: toca autenticación, sesión y datos personales.

## Nota de diseño

### Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| `src/server/migrations/0002_account.sql` | Nueva | Crear las tablas `account` y `session` |
| `src/server/src/domain/mod.rs` | Nueva | Declarar los módulos del dominio |
| `src/server/src/domain/account.rs`: `Username`, `Password`, `FieldErrors`, `validate`, `hash_password` | Nueva | Reglas de usuario y contraseña, y hash Argon2id de la contraseña |
| `src/server/src/domain/session.rs`: `SessionToken` (`generate`, `from_cookie_value`, `value`, `hash`) | Nueva | Crear un token aleatorio y calcular su hash |
| `src/server/src/store/account.rs`: `create_with_session`, `account_exists`, `session_username`, `CreateAccountError` | Nueva | Acceso a datos de la cuenta y de la sesión |
| `src/server/src/store/mod.rs` | Existente | Solo agrega `pub mod account;` |
| `src/server/src/http/session_cookie.rs`: `read`, `set_cookie` | Nueva | Leer la cookie `aes_session` y construir su `Set-Cookie` |
| `src/server/src/http/account.rs`: `create_account` | Nueva | Handler de `POST /api/account` |
| `src/server/src/http/session.rs`: `get_session` | Nueva | Handler de `GET /api/session` |
| `src/server/src/http/error.rs`: `validation_failed`, `invalid_body`, `account_exists`, `internal` | Existente | Producir el cuerpo de error uniforme (ahora con `fields` opcional) |
| `src/server/src/http/mod.rs` | Existente | Registrar las dos rutas en el router de `/api` |
| `src/server/src/lib.rs` | Existente | Solo agrega `pub mod domain;` |
| `src/server/tests/account.rs` | Nueva | Pruebas del servidor de esta tarea |
| `src/web/src/api/session.ts`: `getSession` | Nueva | Llamar a `GET /api/session` y validar la forma de la respuesta |
| `src/web/src/api/account.ts`: `createAccount` | Nueva | Llamar a `POST /api/account` y traducir la respuesta a un resultado |
| `src/web/src/CreateAccountForm.tsx` | Nueva | Formulario de alta y su envío |
| `src/web/src/App.tsx` | Existente | Elegir la vista según la conexión y la sesión |
| `src/web/src/i18n/es.ts` | Existente | Textos nuevos |
| `src/web/src/styles.css` | Existente | Estilos del formulario y de los campos |

### Patrón (nivel 2)
- **Ninguno nuevo.** Se aplican los del catálogo: capas `http` / `store` y ahora `domain` (ya hay reglas: el catálogo lo preveía), `ApiError` como único productor del cuerpo de error y un módulo por llamada a la API.

### Lo que no se hace
- No se crea un trait de repositorio, de «hasher» ni de generador de tokens: una sola implementación.
- No se agrega `axum-extra` ni otra biblioteca de cookies: leer una cookie y escribir un `Set-Cookie` son pocas líneas en `session_cookie.rs`.
- No se agregan `chrono`, `time` ni `uuid`: las fechas las pone SQLite (`DEFAULT` en la migración) y la cuenta tiene clave fija.
- No se consulta «¿existe ya la cuenta?» antes de insertar: la clave fija de `account` es la que garantiza la regla también con dos peticiones a la vez.
- No se guarda el valor del token ni la contraseña: solo sus hashes.
- No se crea un tipo de error global; `CreateAccountError` solo distingue lo que el handler necesita.
- No se crea un enrutador, un contexto de React ni un estado global en la web: `App` guarda la sesión en su propio estado.
- No se crean componentes genéricos (`TextField`, `Button`, `Form`): el catálogo los pospone hasta que se repitan en una segunda pantalla (US-002).
- No se usan las macros `query!` de SQLx (catálogo).

### Nivel 1 donde no es obvio
- **Migración** (`0002_account.sql`):
  ```sql
  CREATE TABLE account (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    username      TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE TABLE session (
    token_hash BLOB NOT NULL PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  ```
- **Dominio** (sin Axum ni SQLx): `validate(username: &str, password: &str) -> Result<(Username, Password), FieldErrors>` comprueba **los dos** campos y devuelve todos los errores juntos. `Username` guarda el texto en minúsculas tras comprobar `^[A-Za-z0-9._-]{3,32}$` (sin la crate `regex`: se comprueba carácter a carácter con `is_ascii_alphanumeric` y `. _ -`, y la longitud en caracteres). `Password` comprueba de 12 a 128 con `chars().count()`. `FieldErrors { username: Option<&'static str>, password: Option<&'static str> }` con los códigos `"invalid"` y `"length"`. `hash_password(&Password) -> Result<String, argon2::password_hash::Error>` con `Argon2::default()` (Argon2id) y sal de `SaltString::generate(&mut OsRng)`; devuelve el formato PHC.
- **Token:** `SessionToken::generate()` llena 32 bytes con `getrandom::fill`; `value()` es su base64url sin relleno (es lo que va en la cookie); `hash()` es el SHA-256 de los bytes de `value()` como texto (`[u8; 32]`). `from_cookie_value(&str)` reconstruye el token desde la cookie sin validarlo contra la base.
- **Store:** `create_with_session(pool, &Username, &str /*hash*/, &[u8; 32]) -> Result<(), CreateAccountError>` abre una transacción con `pool.begin()`, inserta en `account` con `id = 1` y en `session`, y hace `commit`. Si la inserción en `account` falla por la restricción de clave, devuelve `CreateAccountError::AccountExists`: se detecta con `DatabaseError::is_unique_violation()` y, si para la clave primaria de SQLite no lo devuelve, por el código extendido `1555` (`SQLITE_CONSTRAINT_PRIMARYKEY`); una prueba del servidor lo fija. Cualquier otro error es `CreateAccountError::Database(sqlx::Error)`. `account_exists(pool) -> Result<bool, sqlx::Error>`. `session_username(pool, &[u8; 32]) -> Result<Option<String>, sqlx::Error>` devuelve el usuario de la cuenta si el hash está en `session`.
- **Handler `POST /api/account`:** recibe `State<AppState>`, y el cuerpo como `Result<Json<CreateAccountBody>, JsonRejection>` (`{ username: String, password: String }`); cualquier `JsonRejection` (incluido el tipo de contenido que falta) → `ApiError::invalid_body`. Orden: `validate` → 400 `validation_failed` con `fields`; `hash_password` dentro de `tokio::task::spawn_blocking` (un fallo del hash o del `join` → 500 `internal`); `SessionToken::generate()` (fallo → 500 `internal`); `create_with_session` → `AccountExists` 409 `account_exists`, `Database` 503 `database_unavailable` con `tracing::error!`. Éxito: 201, cuerpo `{"username": "<en minúsculas>"}` y la cabecera de `session_cookie::set_cookie(&token)`. Nunca se registra la contraseña ni el token en los logs.
- **Handler `GET /api/session`:** `account_exists`; si hay cookie (`session_cookie::read(&HeaderMap)`), `session_username` con su hash. Respuesta 200 `{"accountExists": bool, "username": string | null}` (`serde(rename_all = "camelCase")`). Error de la base → 503 `database_unavailable`. Una cookie desconocida o malformada da `username: null`, no un error.
- **Cookie:** `set_cookie` devuelve `aes_session=<valor>; HttpOnly; SameSite=Strict; Path=/`. `read` busca `aes_session` en todas las cabeceras `Cookie`, separando por `;` y quitando espacios.
- **`ApiError`:** `ErrorDetail` agrega `#[serde(skip_serializing_if = "Option::is_none")] fields: Option<BTreeMap<&'static str, &'static str>>`; `validation_failed(&FieldErrors)` la llena solo con los campos que fallaron. Mensajes: `validation_failed` «Los datos no son válidos», `invalid_body` «El cuerpo de la petición no es válido», `account_exists` «La cuenta ya está creada», `internal` «Error interno del servidor». Estados: 400, 400, 409 y 500.
- **Web, `api/session.ts`:** `getSession(): Promise<SessionResult>` con `{ kind: 'ok'; accountExists: boolean; username: string | null } | { kind: 'error' }`; `error` ante red caída, respuesta no 2xx o cuerpo con otra forma (como `checkHealth`).
- **Web, `api/account.ts`:** `createAccount(username, password): Promise<CreateAccountResult>` con `{ kind: 'created'; username: string } | { kind: 'exists' } | { kind: 'invalid'; fields: { username?: string; password?: string } } | { kind: 'failed' }`. 201 con `username` de texto → `created`; 409 → `exists`; 400 con `error.code === 'validation_failed'` y `fields` objeto → `invalid`; cualquier otra cosa (500, 503, red caída, 201 con otro cuerpo, cuerpo no JSON) → `failed`. Envía `Content-Type: application/json` y `credentials: 'same-origin'`.
- **Web, `App.tsx`:** el flujo de conexión de EN-001 no cambia; cuando `checkHealth` da `true`, `App` llama a `getSession` en el mismo efecto antes de pasar a `ok`. Si `getSession` da `error`, el estado es `error` (mismo aviso y «Reintentar»: el reintento vuelve a hacer las dos llamadas). En `ok`, debajo de la línea de estado, `App` muestra: sin cuenta → `CreateAccountForm`; con cuenta y sin `username` → `<p>` «La cuenta ya está creada.»; con `username` → `<p>` «Sesión iniciada como <usuario>». Los dos `<p>` son el mismo elemento de resultado (`className="screen-text"`, `tabIndex={-1}`, con ref).
- **Web, `CreateAccountForm.tsx`:** props `onCreated(username: string)` y `onExists()`. `<h2>` «Crear la cuenta»; `<form noValidate>` con tres `<label>` + `<input>` (`id` propios; `autoComplete` `username` y `new-password` ×2; `type="password"` las dos contraseñas; `autoCapitalize="none"` y `spellCheck={false}` en el usuario; sin `maxLength` ni `required`); botón `type="submit"` «Crear cuenta». En el envío: `preventDefault`, ignora un segundo envío mientras hay uno en curso (con una ref, **sin** `disabled`, para que el botón no pierda el foco), llama a `createAccount` con lo escrito tal cual, y según el resultado llama a `onCreated` / `onExists`; con `invalid` o `failed` no hace nada en esta tarea.
- **Estilos:** campos con `--surface`, borde 1 px `--line`, radio 14 px, alto mínimo 44 px, fuente heredada a 16 px (evita el zoom de iOS); etiquetas 600 en `--ink`; «Crear cuenta» reutiliza el aspecto del botón de acción (`.retry` se renombra a `.action-button` y lo usan los dos, sin cambiar sus valores). El foco usa la regla global (`DESIGN.md`); ningún elemento define su propio anillo. `.screen-text` hereda de `.status` el estilo del foco con ratón (`:focus:not(:focus-visible) { outline: none }`).

### Bordes de la API
| Ruta o prefijo | Método no permitido | Ruta desconocida y barra final | Cuerpo de error | Qué lo cubre |
|---|---|---|---|---|
| `/api/session` | 405 `method_not_allowed` (POST, PUT, DELETE…) | `/api/session/` → 404 `not_found` | Uniforme | `method_not_allowed_fallback` y `fallback` del router de `/api` (existentes) |
| `/api/account` | 405 `method_not_allowed` (GET, PUT, DELETE…) | `/api/account/` → 404 `not_found` | Uniforme | Ídem |
| `POST /api/account` con cuerpo no JSON, sin `Content-Type` o sin campos | — | — | 400 `invalid_body` | Mapeo de `JsonRejection` en el handler |

### Comportamiento dinámico de la interfaz
| Transición (qué la causa) | Adónde va el foco | Qué se anuncia y en qué región viva | Anillo de foco visible |
|---|---|---|---|
| Carga inicial con conexión y sin cuenta | No se mueve | La línea de estado de EN-001 («Conectado con el servidor») como hasta ahora | — |
| Carga inicial con cuenta (con o sin sesión) | No se mueve | Ídem | — |
| «Crear cuenta» en curso | Se queda en el botón «Crear cuenta» (no se deshabilita) | Nada | Sí con teclado (`:focus-visible`), como cualquier botón |
| Alta correcta (`created`) | Al elemento de resultado («Sesión iniciada como …», `tabIndex={-1}`), en un `useEffect` de `App` que corre al montarse ese texto **solo si la vista cambió por el formulario** (ref de origen, como `retryInProgress`) | Lo lee el lector al recibir el foco; no es región viva | Solo con teclado (`:focus-visible`); con ratón no se dibuja |
| La cuenta ya existía al enviar (`exists`) | Al elemento de resultado («La cuenta ya está creada.»), igual que la fila anterior | Ídem | Ídem |
| `invalid` / `failed` | No se mueve (TASK-002 lo define) | Nada | — |

- **Regiones vivas:** no se agregan. La `role="status"` y el `role="alert"` de conexión de EN-001 no cambian.
- **Anillo por tipo de elemento** (`DESIGN.md`): la regla global para campos y botones; el elemento de resultado enfocado por programa, solo con teclado.
- **Espacio reservado:** nada aparece ni desaparece dentro del formulario en esta tarea.
- **Respuestas que deben cubrir las pruebas técnicas:** web — `getSession` con 200 válido (con y sin `username`), 503, red caída y 200 con otro cuerpo; `createAccount` con 201 válido, 201 con otro cuerpo, 400 `validation_failed`, 400 con otro código, 409, 500, 503, red caída y cuerpo no JSON; `App` en las tres vistas y con `getSession` en error. Servidor — sesión sin cuenta, con cuenta sin cookie, con cookie válida, con cookie desconocida y con cookie malformada; alta correcta (201, cuerpo, `Set-Cookie` con sus atributos, usuario en minúsculas, `password_hash` que empieza por `$argon2id$`, `session` con el hash del token y no el token); 400 con cada campo y con los dos; bordes de longitud (3 y 32; 12 y 128; 11 y 129; emojis); 409 con cuenta existente (y la cuenta no cambia); dos altas concurrentes → un 201 y un 409; `invalid_body` sin cuerpo, sin `Content-Type` y con JSON sin campos; 405 y barra final de las dos rutas.

### ¿Cambia el catálogo de diseño?
Sí, en el cierre: capa `domain`, regla de «una sola fila» con clave fija, sesión por cookie con hash del token, `fields` en `ApiError`, mapeo de `JsonRejection`, elemento de resultado enfocado tras un cambio de vista asíncrono, `.action-button`.

## Estados que introduce
- **Vista de la tarjeta** (en `App`): `crear` (sin cuenta), `cuenta-creada` (cuenta sin sesión), `con-sesión`. La crea `getSession` al conectar; `crear` pasa a `con-sesión` con `created` y a `cuenta-creada` con `exists`. Recargar la recalcula desde el servidor.
- **Envío en curso** (en el formulario, ref): lo crea el envío; lo limpia cualquier resultado de `createAccount`.

## Dependencias
Ninguna tarea previa. TASK-002 parte de esta.

## Comandos exactos de validación
```
cargo fmt --check --manifest-path src/server/Cargo.toml
cargo clippy --manifest-path src/server/Cargo.toml --all-targets --locked -- -D warnings
cargo test --manifest-path src/server/Cargo.toml --locked
npm --prefix src/web run lint && npm --prefix src/web run typecheck && npm --prefix src/web test && npm --prefix src/web run build
npm --prefix tests/acceptance test -- --grep "@US-001-AC-02(?![\w-])|@US-001-AC-05(?![\w-])"
bash specs/US-001/US-001.verify
npm --prefix tests/acceptance test -- --grep "@EN-001(?![\w-])|@ST-001(?![\w-])"
```

## Pruebas de regresión afectadas
`tests/acceptance/tests/en-001.spec.ts`, `tests/acceptance/tests/st-001.spec.ts`, `src/server/tests/health.rs`, `src/web/src/App.test.tsx`.

## Presupuesto orientativo de diff
- Producción: ~420 líneas (servidor ~280, web ~140). Supera el orientativo de 300: es la primera tabla, la primera regla de dominio y la sesión, que no se pueden separar sin dejar una tarea sin criterio que poner en verde.
- Pruebas: ~400 líneas.

## Condición de terminación
Los comandos de validación en verde, la revisión de seguridad aplicada y el informe con la salida real de cada comando.
