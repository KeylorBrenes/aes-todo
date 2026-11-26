# Plan técnico — US-001

[Para los agentes: orquestador, QA, programador y verificador (03 §1.2). Se elimina en el cierre.]

- **Historia:** [US-001](US-001.md)
- **Resumen estructural usado:** `aes-outline.sh HEAD src/server src/web/src` en `6adaae0`, más la lectura de `src/server/src/{config,http/*,store/*}.rs`, `src/web/src/{App.tsx,api/health.ts,i18n/es.ts}` y `tests/acceptance/fixtures/app.ts`

## Contrato de interfaz

### API (JSON, mismo origen que la web, bajo `/api/`)
| Tipo | Definición |
|---|---|
| API | `GET /api/session` → 200 `{"accountExists": bool, "username": string \| null}`. `username` es el de la sesión del navegador (cookie válida) o `null`. Nunca 401: la pantalla decide con estos dos campos. 503 `database_unavailable` si la base no responde |
| API | `POST /api/account` con `{"username": string, "password": string}` → 201 `{"username": "<en minúsculas>"}` y `Set-Cookie` de sesión. La cuenta y su sesión se crean en una sola transacción: o quedan las dos o ninguna |
| API | `POST /api/account` con datos inválidos → 400 `{"error":{"code":"validation_failed","message","fields":{"username"?: "invalid", "password"?: "length"}}}`. No se crea nada |
| API | `POST /api/account` cuando ya existe una cuenta → 409 `{"error":{"code":"account_exists","message"}}`, también si dos peticiones llegan a la vez con la base vacía (solo una recibe 201). La cuenta existente no cambia |
| API | Cuerpo que no es JSON o le faltan campos → 400 `{"error":{"code":"invalid_body","message"}}` (nunca el texto plano por defecto de Axum). Otros métodos en `/api/session` y `/api/account` → 405 `method_not_allowed`, como el resto de `/api` |
| API | Fallo de la base al crear → 503 `database_unavailable`; cualquier otro fallo → 500 `{"error":{"code":"internal","message"}}` |
| Cookie | Nombre `aes_session`; valor aleatorio de 32 bytes (base64url); `HttpOnly; SameSite=Strict; Path=/`, sin `Max-Age` ni `Expires` en la base (la sesión dura hasta US-003). `Secure` llega con HTTPS (EN-003) |

**Reglas de validación** (servidor y web, idénticas):
- Usuario: `^[A-Za-z0-9._-]{3,32}$`; se guarda y se devuelve en minúsculas. Sin recortar espacios: un espacio lo hace inválido.
- Contraseña: de 12 a 128 caracteres contados como puntos de código Unicode (Rust `chars().count()`, JS `[...s].length`). Cualquier carácter.
- La repetición de la contraseña solo existe en la web: el servidor no la recibe.

**Almacenamiento:** la contraseña se guarda solo como hash Argon2id en formato PHC (`$argon2id$…`); el token de sesión, solo como hash (SHA-256), nunca el valor de la cookie.

### Pantalla (lo que usan las pruebas: roles y nombres accesibles, no clases ni `data-testid`)
| Estado | Lo que hay en la tarjeta (debajo del nombre de la app) |
|---|---|
| Comprobando | El estado «Conectando…» de EN-001 |
| Servidor caído | El aviso y «Reintentar» de EN-001, sin cambios |
| Sin cuenta | Encabezado «Crear la cuenta»; campos con etiqueta «Usuario», «Contraseña» y «Repetir la contraseña»; botón «Mostrar contraseña» (cambia a «Ocultar contraseña» y afecta a los dos campos de contraseña); indicador «Faltan N caracteres» / «Falta 1 carácter» mientras haya de 1 a 11, ausente con 0 o con 12 o más; botón «Crear cuenta» |
| Con cuenta y sin sesión | Texto «La cuenta ya está creada.», sin formulario |
| Con sesión | Texto «Sesión iniciada como <usuario>» |

- La línea de estado de EN-001 («Conectado con el servidor») sigue visible en todos los estados conectados, para no romper la regresión de EN-001.
- Errores por campo, visibles al pulsar «Crear cuenta», junto al campo y asociados a él (descripción accesible): usuario → «El usuario debe tener de 3 a 32 caracteres: letras sin acento, números, punto, guion bajo o guion.»; contraseña → «La contraseña debe tener de 12 a 128 caracteres.»; repetición distinta → «Las contraseñas no coinciden.» (en el campo «Repetir la contraseña»). Los campos no tienen `maxlength`.
- Fallo al crear (500, 503 o sin red): «No se pudo crear la cuenta. Intentar de nuevo.» en un aviso (`role="alert"`); los campos conservan lo escrito; el aviso desaparece al volver a pulsar «Crear cuenta».
- Un 409 al crear muestra «La cuenta ya está creada.» (alguien la creó mientras tanto).

### Restricciones para las pruebas
- El fixture actual arranca **un** servidor por worker con una base nueva. Las pruebas de US-001 necesitan una base **sin cuenta** cada una: cada prueba que parte de «sin cuenta» arranca su propio servidor con su propia base (fixture con alcance de prueba en el mismo puerto 5080, un solo worker), o se encadenan en un orden que no dependa de otra prueba. QA decide cómo, sin cambiar el comportamiento de las pruebas de EN-001.
- AC-06: el fallo del servidor y la falta de red se simulan interceptando `POST /api/account` en el navegador (500 y conexión abortada). «Sin cuenta a medias» se comprueba con `GET /api/session` → `accountExists: false` después del fallo.
- AC-05 (por otro camino y a la vez): `POST /api/account` directo con un cliente HTTP, y dos peticiones simultáneas con la base vacía.
- AC-07: el fixture expone `dbPath`; la comprobación lee los bytes del archivo de la base **y** de su `-wal` y busca la contraseña tal cual (y su forma en UTF-16 no hace falta: SQLite guarda texto en UTF-8).

## Corte vertical
- **Migración** `0002_account.sql`: tabla de la cuenta con una sola fila posible (clave fija con `CHECK`), lo que hace la regla «una sola cuenta» atómica en la base; tabla de sesiones (hash del token, fecha de creación UTC).
- **Servidor:** validación de usuario y contraseña (dominio, sin Axum ni SQLx), hash Argon2id, creación de cuenta y sesión en una transacción en `store`, handlers `GET /api/session` y `POST /api/account`, lectura de la cookie, nuevos códigos de `ApiError` (`validation_failed` con `fields`, `invalid_body`, `account_exists`, `internal`).
- **Web:** módulo de API para la sesión y para crear la cuenta, pantalla «Crear la cuenta» con sus ayudas, errores y aviso, y los estados «La cuenta ya está creada.» y «Sesión iniciada como …», textos en `i18n/es.ts`.
- Nada de inicio de sesión con formulario, cierre de sesión ni límite de intentos (US-002, US-003).

## Tareas (3 como máximo, 04 §3)
[Se completan después de la entrega de QA.]

**Criterios que verifican el harness:** ninguno.

## Riesgos técnicos y preguntas abiertas
- Dependencias nuevas en el servidor (Argon2id, aleatoriedad del token, hash SHA-256, quizá cookies): requieren `aes:deps-approved`.
- Argon2id con parámetros por defecto tarda decenas de ms por hash: aceptable para una cuenta; no se ejecuta en el hilo del runtime sin `spawn_blocking`.
- Sin `Secure` en la cookie hasta EN-003 (en local no hay HTTPS); queda anotado para EN-003.

## Para consolidar en el cierre
- Catálogo de diseño: códigos de error nuevos, patrón de sesión por cookie, validación compartida web/servidor, fixture por prueba.
- ADR: convención de sesión (cookie, hash del token, sin caducidad) si US-002 la reutiliza tal cual.
