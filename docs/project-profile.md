# Project Profile — aes-todo (nombre provisional)

- **AES version:** 1.4.0
- **Product owner / aprobador humano:** GG_WellCoded (responsable del producto)
- **Repositorio:** https://github.com/KeylorBrenes/aes-todo
- **Ramas (07 §7):** `main` (liberado) y `dev` (integrado), ambas protegidas; ramas de trabajo cortas desde `dev`, hotfixes desde `main`
- **Release:** lo aprueba e integra el responsable del producto (PR `dev` → `main`, merge commit); tag `vX.Y.Z`; notas en `docs/releases/`
- **Copia local de DoR/DoD:** `docs/aes/08-definition-of-ready-and-done.md`, de AES 1.4.0

## Roles: harness y modelo
El modelo real de cada ejecución se registra en las métricas (09 §6); si difiere de esta tabla, se anota.

| Rol | Harness | Modelo | Invocación | Identidad con la que publica | Proveedor y condiciones de datos (06 §12) |
|---|---|---|---|---|---|
| Orquestador (modelo más capaz disponible, 06 §11) | Claude Code | Claude Opus 5.5 | Sesión principal | GitHub App de los agentes (`AES_IDENTITY=app`) | Anthropic |
| QA | OpenCode | `opencode/deepseek-v4.1-flash-free` | `.claude/scripts/aes-oc.sh` (`AES_BIND_QA`) | GitHub App de los agentes | OpenCode (promoción gratuita; sin retención ni entrenamiento según su política) |
| Programador | OpenCode | `opencode/deepseek-v4.1-flash-free` | `.claude/scripts/aes-oc.sh` (`AES_BIND_PROGRAMMER`) | GitHub App de los agentes | Ídem |
| Mecánico (opcional) | OpenCode | `opencode/deepseek-v4.1-flash-free` | `.claude/scripts/aes-oc.sh` (`AES_BIND_MECHANIC`) | GitHub App de los agentes | Ídem |
| Verificador (otra familia de modelos que el programador, 06 §12) | Claude Code (subagente) | Sonnet (`.claude/agents/verifier.md`) | Agent `verifier` | GitHub App de los agentes | Anthropic |

Huecos de control de los roles en otro harness (06 §12, punto 3): los hooks de `.claude/hooks/` no corren dentro de OpenCode. Para esos roles, la superficie de cambio y las rutas protegidas las controlan el guardián de la CI (`ci/aes-guard.sh`, L3) y la configuración de permisos de `opencode.json`.

## Producto y contexto
- Objetivo: lista de tareas personal, segura y persistente, con proyectos, subtareas, etiquetas y medición de duración (`docs/project-brief.md`).
- Usuarios: una sola persona (el dueño).
- Restricciones: una sola cuenta con contraseña; datos en el servidor; WCAG 2.2 AA; diseño adaptable; modo oscuro; español, con inglés en REL-003; tono neutro.
- Entornos: local (REL-001 y REL-002); producción por definir (SP-001).

## Stack
- Lenguaje y versión: Rust estable (edición 2024); TypeScript 5 (modo estricto); Node 22 LTS para las herramientas de la web y las pruebas.
- Framework y versión: Axum 0.8 + Tokio; React 19 + Vite. EN-001 fija las versiones exactas.
- Base de datos: SQLite (WAL) mediante SQLx, con migraciones en `src/server/migrations/`.
- Infraestructura/despliegue: un binario que sirve la web compilada; dónde se publica queda por definir (SP-001).
- Integraciones: ninguna.

## Arquitectura y convenciones
- Directorios/módulos importantes: `src/server/` (crate Rust: `http`, `domain`, `store`), `src/web/` (React), `tests/acceptance/` (Playwright, solo QA). EN-001 actualiza las rutas en `CLAUDE.md`.
- Patrones existentes que deben respetarse: el dominio no depende de Axum ni de SQLx; textos de la interfaz en catálogos de i18n; fechas en UTC fijadas por el servidor.
- Contratos y APIs: REST JSON bajo `/api/`; fechas en ISO 8601 UTC; errores `{"error":{"code","message"}}`.
- ADRs: `docs/adr/` (ADR-001, stack).
- Reglas de compatibilidad: las migraciones solo avanzan; nada se borra físicamente fuera de la papelera.

## Backlog
- Herramienta / ubicación: `docs/backlog.md` (02 §11)
- Releases: definidos en la incepción (01 §2, 02 §12)
- Prefijos de ID: historias `US-`, enablers `EN-`, defectos `BUG-`, chores `CH-`, lotes `ST-`, spikes `SP-`
- Escala de prioridad: P0 (bloquea todo), P1 (release en curso), P2 (siguiente release), P3 (más adelante)
- Escala de Story Points: Fibonacci 1, 2, 3, 5, 8, 13
- Estados: Draft, Ready, In Progress, Review, Accepted, Released, Deferred
- Criterios propios para clasificar tracks T0–T3 (si difieren de 02 §8): los de 02 §8; todo lo que toca autenticación, sesión o borrado de datos es al menos T2.

## Skills y herramientas (06 §6.2)
| Skill / herramienta | Tipo (técnica / herramienta) | Origen y versión | Licencia | Revisada por | Roles |
|---|---|---|---|---|---|
| aes-debugging | Técnica | AES v1.4.0 | — | Orquestador | Programador, mecánico |
| aes-inception | Técnica | AES v1.4.0 | — | Orquestador | Orquestador |
| aes-cycle | Técnica | AES v1.4.0 | — | Orquestador | Orquestador |
| aes-design-note | Técnica | AES v1.4.0 | — | Orquestador | Orquestador |
| aes-security-review | Técnica | AES v1.4.0 | — | Orquestador | Programador |
| impeccable | Técnica + herramienta | v4.10.0 (`docs/aes/skills.lock`) | Apache-2.0 | Orquestador | Orquestador, programador, verificador |
| archify | Herramienta | v3.2.0 (`docs/aes/skills.lock`) | MIT | Orquestador | Orquestador |

- Análisis estático de seguridad en la CI (05 §7): Semgrep `p/owasp-top-ten` sobre lo que cambia la tarea; bloquea la severidad ERROR. Además, `cargo audit` y `npm audit --audit-level=high` (EN-001).
- Detector de interfaz en la CI (05 §7): `impeccable detect`; por ahora solo anota, ninguna regla bloquea.
- Consultas de red que una skill no permite desactivar (06 §6.2): la página de direcciones de impeccable consulta su catálogo (no envía código ni archivos); se usa solo en la incepción y con el humano presente. Archify corre con `ARCHIFY_UPDATE_CHECK_DISABLED=1`.

## Diseño (10)
- Catálogo de diseño: `docs/design-catalog.md` (se crea con EN-001)
- Herramienta del resumen estructural (archivos y firmas públicas): por definir en EN-001
- Reglas del nivel 1 cubiertas por linters en la CI (herramienta y regla): `cargo clippy -D warnings` (incluye `clippy::unwrap_used` fuera de las pruebas); ESLint con `@typescript-eslint/strict`
- Excepciones documentadas al nivel 1: ninguna
- Sistema visual: `DESIGN.md` y `PRODUCT.md` (impeccable)

## Defectos y compuerta de estabilización (02 §9)
- Escala de severidad: Crítica / Alta / Media / Menor. Cualquier pérdida de datos o acceso sin sesión es Crítica.
- Límite de defectos Menores abiertos (por defecto 5): 5
- Dónde se implementa la compuerta (CI, L3): `ci/defect-gate.sh` en `.github/workflows/aes.yml`
- Regla permanente para hallazgos tras un PASS del verificador (02 §9.3): lo que añade la tarea se corrige antes de integrar; lo demás va al backlog con severidad.
- Corridas sin fallo exigidas para dar por estable una prueba corregida (05 §6): 10

## Calidad y pruebas
Los comandos todavía no funcionan: EN-001 los hace funcionar.

- Unit tests (comando): `cargo test --manifest-path src/server/Cargo.toml` · `npm --prefix src/web test`
- Integration tests (comando): `cargo test --manifest-path src/server/Cargo.toml` (pruebas en `src/server/tests/` con una base de datos SQLite temporal)
- E2E / aceptación (comando, con filtro por historia): `npm --prefix tests/acceptance test -- --grep "@US-001(?![\w-])"`
- Lint / formato: `cargo fmt --check` · `cargo clippy --all-targets -- -D warnings` · `npm --prefix src/web run lint`
- Tipos / análisis estático: `npm --prefix src/web run typecheck` (`tsc --noEmit`)
- Seguridad / dependencias: `cargo audit` · `npm audit --audit-level=high`
- Umbrales justificados: ninguno por ahora
- Generación del test map (herramienta o método): por etiquetas `@ID` de Playwright
- Proporción de pruebas holdout: por definir en EN-001
- Presupuesto de diff orientativo por tarea (producción / pruebas): 300 / 400 líneas
- Herramienta de prueba manual agéntica (Playwright, curl, etc.): Playwright y curl
- Herramienta que arranca y detiene servidores (06 §10) y puertos del proyecto: `.claude/scripts/with-servers.sh`; API en `:5080` y web en `:5173`
- Herramienta que comprueba el RED (05 §2.2): `ci/red-check.mjs`
- Comandos de verificación por elemento (05 §12): `specs/<ID>/*.verify`, ejecutados con `ci/run-verify.sh`
- Política de auditoría de dependencias: `cargo audit` y `npm audit` en cada PR; un hallazgo alto o crítico bloquea

## Controles en capas (06 §9)
Los que trae la instalación de AES 1.4.0 (`.claude/hooks/`, `ci/`, `.github/workflows/aes.yml`); EN-001 adapta la sección STACK de la CI, `ci/validate.sh` y `.claude/aes.env`, que hoy traen el ejemplo de .NET.

## Permisos y operación de agentes
- Rutas editables por programador: `src/`, `tests/` salvo `tests/acceptance/`, dentro de la superficie de la tarea
- Rutas protegidas: `tests/acceptance/`, `specs/`, `ci/`, `.github/`, `.claude/`, `.opencode/`, `docs/ci/`, `opencode.json`, `CLAUDE.md`
- Ubicación de las pruebas holdout: por definir en EN-001
- Operaciones que requieren aprobación: integrar a `dev` o `main`, cambios en rutas protegidas, nuevas dependencias, supresiones `nosemgrep`
- MCP/CLI expuestos: `gh`, `cargo`, `npm`, `node`
- Skills instaladas y su origen: ver la tabla de skills
- Gestión de secretos: variables de entorno; nunca en el repositorio
- Estrategia de ramas/worktrees: `.claude/scripts/aes-wt.sh`, un worktree por rol
- Umbral del circuit breaker (≤ 3): 3
- Notas del orquestador durante el ciclo (ubicación y script): según `aes-cycle`

## Riesgo y liberación
- Clasificación de riesgo: Medio (datos personales de una sola persona, sin pagos)
- Controles High/Critical (T3): autenticación, sesión y borrado de datos requieren revisión de seguridad (`aes-security-review`)
- Migraciones/rollback: migraciones SQLx solo hacia adelante; respaldo antes de migrar en producción (EN-002)
- Aprobación de despliegue: responsable del producto

## Mejora del harness
- Ubicación del registro de fallos: `docs/agent-failure-log.md`
- Ubicación del registro de hallazgos y métricas: `docs/harness-findings.md`
- Frecuencia de retrospectiva compuesta: al cerrar cada release

## Excepciones AES
| Regla | Motivo | Riesgo | Mitigación | Aprobador | Revisión/expiración |
|---|---|---|---|---|---|
