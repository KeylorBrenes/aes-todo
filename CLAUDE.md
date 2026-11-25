# [Proyecto] — instrucciones del proyecto

Proyecto gestionado con **AES 1.4.1** (https://github.com/KeylorBrenes/AES---Agent-Method).

## Al empezar cada sesión
- **Si no existe `docs/backlog.md`, el proyecto todavía no tiene planeamiento:** antes de cualquier otra cosa, usa la skill `aes-inception` y pregúntale al humano por la idea (por bloques de preguntas concretas). No escribas código ni crees historias sin eso.
- Si existe, sigue con lo que pida el humano; para avanzar un elemento del backlog, la skill `aes-cycle`.

## Ramas
- `main`: lo liberado. `dev`: lo integrado y la base de todo el trabajo. A `main` solo llegan releases (`dev → main`) y hotfixes de defectos (`BUG-NNN`), y después de cada uno se hace un back-merge `main → dev` (merge commit).
- El checkout principal se queda en `dev`; cada rol trabaja en su propio worktree (`.claude/scripts/aes-wt.sh`).

## Roles
- La **sesión principal** es el orquestador AES, en el modelo más capaz disponible (es el diseñador senior): para avanzar un elemento del backlog, usa la skill `aes-cycle`. Un elemento por sesión.
- Los roles `qa`, `programmer`, `mechanic` y `verifier` siguen su propio contrato en `.claude/agents/`. Corren como subagentes de Claude Code o en OpenCode, según `AES_BIND_*` en `.claude/aes.env` (los de OpenCode se delegan con `.claude/scripts/aes-oc.sh`).
- Skills del núcleo de AES en `.claude/skills/`: `aes-inception` (orquestador, al empezar el proyecto o ante una idea que no cabe en el backlog), `aes-cycle` (orquestador), `aes-design-note` (orquestador), `aes-debugging` y `aes-security-review` (programador). Las de terceros están en `docs/aes/skills.lock`; si está impeccable, la interfaz sigue `DESIGN.md`, y cambiar la dirección visual es una decisión del humano. Ninguna skill de flujo de terceros (planes, ejecución, cierre de ramas) se instala junto a ellas.
- Hooks en `.claude/hooks/` restringen qué escribe cada rol. Si uno te bloquea, no lo rodees ni se lo pidas a otro agente: reporta BLOCKED para el humano.

## Estructura
- `src/server/`: servidor Rust (Axum + SQLx, SQLite), con sus pruebas en `src/server/tests/` y migraciones en `src/server/migrations/`. `src/web/`: web React + TypeScript + Vite, con pruebas Vitest junto al código (programador).
- `tests/acceptance/`: pruebas de aceptación (**solo QA**).
- `specs/<ID>/<ID>.md`: la historia, en lenguaje de cliente; se conserva. `specs/<ID>/plan.md`, `TASK-*`, `acceptance-test-plan.md`: el plan técnico, que se elimina en el cierre. `*.verify`: comandos de verificación, se conservan (**orquestador, QA y humano**).
- `docs/backlog.md`: única fuente del backlog; el tablero (`node .claude/scripts/aes-board.mjs` → `.aes/board.html`) se genera desde ahí.
- `docs/`: brief, arquitectura, ADRs, catálogo de diseño, perfil, backlog (con severidad de defectos), hallazgos, `docs/aes/` (DoR/DoD).

## Comandos
- Validaciones: `bash ci/validate.sh` (servidor: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`; web: lint, typecheck, test, build)
- Aceptación de un elemento: `npm --prefix tests/acceptance test -- --grep "@US-001(?![\w-])"`
- Guardián: `BASE_REF=origin/dev TASK_SCOPE_FILE=specs/<ID>/<TASK>.scope bash ci/aes-guard.sh`
- Compuerta de estabilización: `BASE=origin/dev bash ci/defect-gate.sh start <ID>`
- Servidores para pruebas manuales: `bash .claude/scripts/with-servers.sh [--web] -- <comando>`

## Rutas protegidas
`tests/acceptance/`, `specs/`, `ci/`, `.github/`, `.claude/`, `.opencode/`, `docs/ci/`, `opencode.json`, `CLAUDE.md`.

## Convenciones que el linter no detecta
- [Una línea por convención real del proyecto: formato de fechas y montos en la API, errores, patrones prohibidos.]
- Commits: `struct:` (sin cambio de comportamiento) o `feat:` / `fix:` / `test:` / `docs:` / `chore:`. Nunca se mezclan.
- Historias atómicas y verticales, con título «Como… quiero… para…»; nada de código provisional ni «refactorizar después».
- Pruebas de aceptación: etiqueta del elemento y del criterio (`{ tag: ['@US-001', '@US-001-AC-03'] }`) y el ID del criterio al inicio del título.

## Fallos observados
[Una entrada por cada error real que valga la pena registrar (AES 09). Empieza vacío.]
