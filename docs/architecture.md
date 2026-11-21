# Architecture Overview — aes-todo

Solo lo que necesitan EN-001 y las primeras historias (AES 01 §3, §6). Crece con cada historia.

## Contexto y límites
- **Actor:** el dueño de la app (un único usuario), desde un navegador de escritorio o de celular.
- **Límite de confianza:** el navegador no es de confianza; toda regla (sesión, una sola cuenta, fechas de inicio y fin) se aplica en el servidor.
- **Sistemas externos:** ninguno en REL-001. En REL-003 se suman la plataforma de despliegue y el almacenamiento de respaldos (SP-001).

## Vista de componentes
Diagrama: `docs/diagrams/architecture.json`, que es la fuente que se versiona. El visor se genera en `.aes/diagrams/architecture.html`.

| Componente | Responsabilidad | Ubicación prevista |
|---|---|---|
| Web (React + TS + Vite) | Pantallas, estado de la interfaz, textos traducibles y formato de fechas y duraciones para mostrar | `src/web/` |
| Servidor (Axum) | API JSON en `/api/*`, sesión y autenticación, reglas de negocio de las tareas; sirve la web compilada en `/` | `src/server/` |
| Base de datos (SQLite, WAL) | Persistencia de la cuenta, las sesiones y las tareas; migraciones SQLx | archivo configurado con `DATABASE_URL` |

## Dependencias y reglas
- Web → API solo por HTTP/JSON, sin acceso directo a la base de datos.
- Dentro del servidor: `http` (rutas y extractores) → `domain` (reglas, sin Axum ni SQLx) ← `store` (SQLx). El dominio no depende de la infraestructura.
- Las fechas las fija el servidor en UTC; la web solo las presenta.
- La web no conoce el esquema de la base de datos: el contrato es la API.

## Datos
Entidades previstas (se concretan en cada historia):
- **Cuenta:** una sola fila, con usuario y hash Argon2id de la contraseña (US-001).
- **Sesión:** identificador aleatorio, fecha de creación y de expiración (US-002, US-003).
- **Tarea:** id, texto, `created_at`, `started_at?`, `completed_at?`, `deleted_at?` (borrado lógico, US-007) y `parent_id?` (REL-002, dos niveles).
- **Etiqueta** y **tarea–etiqueta** (REL-002).

Fechas en UTC con formato ISO 8601 en la API. La duración se calcula como `completed_at - started_at`. Las migraciones se versionan en `src/server/migrations/` y se aplican al arrancar. Nada se borra físicamente salvo desde la papelera (US-017).

## Interfaces e integraciones
- `GET /api/health` → `200 {"status":"ok"}` (EN-001; `AES_API_HEALTH`).
- API REST JSON bajo `/api/`; errores con un cuerpo uniforme `{"error": {"code", "message"}}` (se fija en EN-001).
- Sin integraciones externas.

## Seguridad y privacidad
- Contraseña con hash Argon2id; nunca se registra ni se devuelve.
- Sesión en el servidor con cookie `HttpOnly`, `SameSite=Strict` y `Secure` fuera de local. Todo `/api/*` exige sesión, salvo `health`, el estado inicial y los endpoints de crear cuenta e iniciar sesión.
- Crear cuenta solo funciona si no existe ninguna (US-001).
- Límite de intentos de inicio de sesión (US-002).
- Secretos y rutas por variables de entorno; ninguno en el repositorio.
- Consultas parametrizadas (SQLx), sin SQL construido con texto.

## Despliegue y operación
- **REL-001:** local. Un binario más el archivo SQLite; la web compilada se sirve desde el mismo binario.
- **Puertos de desarrollo:** API en `:5080` y Vite en `:5173` con proxy a la API (`.claude/aes.env`).
- **REL-003:** despliegue con HTTPS y respaldo diario restaurable (SP-001, EN-002, EN-003).

## Calidad no funcional
- **Accesibilidad:** WCAG 2.2 AA, comprobada con axe en las pruebas de aceptación.
- **Diseño adaptable:** desde 360 px de ancho.
- **Modo oscuro** (US-022) e **i18n** (US-023): los textos de la interfaz viven en catálogos desde US-004/US-005, nunca escritos directamente en los componentes.
- **Mantenibilidad:** `clippy -D warnings`, ESLint y TypeScript estricto.

## Restricciones y decisiones abiertas
- Dónde se publica: SP-001.
- Recuperación de la contraseña olvidada: por definir en el refinamiento de US-002.
- Biblioteca de i18n de la web: se decide en US-005.

## ADRs relacionados
| ID | Decisión | Estado |
|---|---|---|
| ADR-001 | Axum + SQLx + SQLite, React + TypeScript + Vite | Accepted |
