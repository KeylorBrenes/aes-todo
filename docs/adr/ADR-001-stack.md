# ADR-001: Stack — Axum + SQLite + React

- **Estado:** Accepted
- **Fecha:** 2026-11-21
- **Responsable:** Orquestador AES
- **Aprobador:** Responsable del producto (GG_WellCoded), en la entrevista de incepción

## Contexto
- La app es para una sola persona, con pocos datos, y lo que más importa es que **no se pierdan**: tienen que vivir en el servidor, protegidos con contraseña.
- El responsable del producto pidió **Rust en el servidor**.
- La web tiene que adaptarse al escritorio y al celular, cumplir WCAG 2.2 AA y tener modo oscuro, y más adelante estar en español y en inglés.
- **El código lo mantienen los agentes AES** y el humano solo aprueba, así que importan mucho la popularidad, la documentación y la estabilidad de cada pieza.
- Primero corre en local; dónde se publica queda por definir (SP-001). Lo ideal es desplegar un solo artefacto con una base de datos fácil de respaldar.

## Decisión
- **Servidor:** Rust (edición 2024, toolchain estable) con **Axum** sobre Tokio, y **SQLx** con **SQLite** en modo WAL. Las migraciones se versionan en el repositorio y corren al arrancar.
- **Autenticación:** una cuenta única con la contraseña en hash **Argon2id**, y sesión en el servidor con una cookie `HttpOnly`, `SameSite=Strict` y `Secure` fuera de local.
- **Web:** **React + TypeScript + Vite**, compilada a archivos estáticos que el binario de Axum sirve en `/`, con la API JSON en `/api/*`. En desarrollo, Vite hace de proxy hacia la API.
- **Pruebas:** `cargo test` en el servidor (unitarias y de integración contra una base de datos temporal), **Vitest** en la web y **Playwright** para la aceptación de punta a punta (`tests/acceptance/`).
- **Calidad:** `cargo fmt --check`, `cargo clippy -D warnings`, ESLint y `tsc --noEmit`, además de `cargo audit` y `npm audit`.

Por qué: es la combinación más usada y mejor documentada de cada lado. Un solo binario con un archivo SQLite es lo más fácil de desplegar y de respaldar (`VACUUM INTO` o una copia del archivo), y SQLite sobra para una sola persona.

## Alternativas consideradas
| Alternativa | Ventajas | Costes/riesgos |
|---|---|---|
| **Axum + SQLite + React** (elegida) | Ecosistemas maduros y muy documentados; los agentes los conocen bien; un solo binario; respaldo trivial | Dos lenguajes (Rust y TypeScript) y dos cadenas de herramientas |
| Axum + SQLite + SvelteKit (estático) | Web más ligera y con menos código | Ecosistema más pequeño y menos componentes accesibles listos para usar |
| Leptos (todo Rust, WebAssembly) | Un solo lenguaje y tipos compartidos | Ecosistema joven con cambios frecuentes; los agentes lo conocen menos; compilaciones lentas; pruebas de interfaz más difíciles |
| PostgreSQL en lugar de SQLite | Escala a varios usuarios y la mayoría de las plataformas lo administran | Un servicio más que operar y pagar, sin beneficio para una sola persona |

## Consecuencias
- La CI necesita las cadenas de herramientas de Rust y de Node; EN-001 adapta `ci/validate.sh`, el flujo de la CI y `.claude/aes.env`, que hoy traen el ejemplo de .NET.
- Para publicar hace falta un disco persistente para el archivo SQLite (lo evalúa SP-001).
- La seguridad de la sesión (CSRF, límite de intentos) es responsabilidad de la app y se especifica en US-002.
- Las migraciones de SQLite son más limitadas (`ALTER TABLE`), así que los cambios de esquema grandes recrean la tabla.

## Reversibilidad y riesgos
- Cambiar SQLite por PostgreSQL es moderado: SQLx soporta los dos, aunque las consultas y las migraciones se revisan.
- Cambiar el framework de la web es caro una vez haya varias pantallas, pero no toca el servidor gracias al contrato JSON.
- Riesgo: que los agentes rindan menos en Rust. Se mitiga con `clippy -D warnings`, pruebas de aceptación de punta a punta y el verificador independiente.

## Referencias
- `docs/project-brief.md`, `docs/architecture.md`, `docs/backlog.md` (EN-001)
