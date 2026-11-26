# Agent Failure Log — aes-todo

Registro de fallos observados en agentes y de los controles añadidos para evitarlos (AES 09). Se registran hechos observables, no juicios sobre el modelo.

## Patrones activos
| Patrón | Entradas | Control aplicado | Capa | Estado |
|---|---|---|---|---|
| **BLOCKED por una preparación de la tarea que no anticipa lo que el rol necesita.** El rol hace bien su trabajo, pero topa con algo que el orquestador no previó al preparar la tarea: un archivo que debe cambiar y no está en la superficie, una herramienta que falta en el entorno, o una lectura fuera del worktree. Cada caso cuesta una ida y vuelta con el humano (enmienda, instalación o permiso) y una segunda delegación. Señal para mejorar la metodología: el control debe estar en la preparación (nota de diseño, `aes-doctor`, plantillas), no en el rol | FL-005 (lectura fuera del worktree), FL-006 (superficie), hallazgo del 2026-11-21 19:19 de EN-001 TASK-001 (enlazador MSVC) | Entorno: `aes-doctor` con `AES_DOCTOR_CHECKS` (aplicado tras EN-001). Lectura: `aes-oc.sh` copia `.aes/` al worktree (AES 2.0). Superficie: el de FL-006 | Skill `aes-design-note` y plantilla de tarea | Entorno y lectura: Aprobado. Superficie: Propuesto |

---

## FL-001 — 2026-11-21
- **Agente / harness / modelo:** qa / opencode v2.2.7
- **Tarea / historia:** EN-001
- **Síntoma:** aes-oc.sh pasa --dir a 'opencode run', flag que esta versión ya no reconoce; OpenCode imprime la ayuda, jq falla y el script sale con 5 (no 4) sin ejecutar el rol
- **Detectado por:** Orquestador (log vacío, worktree sin cambios)
- **Causa probable:** —
- **Control propuesto:** Quitar --dir (el script ya hace cd al worktree) y validar la versión de opencode en el arranque; tratar la salida no-JSON como código 4
- **Aprobado por / fecha:** —
- **Verificado en:** —

## FL-002 — 2026-11-21
- **Agente / harness / modelo:** programmer / opencode/deepseek-v4.1-flash-free
- **Tarea / historia:** EN-001
- **Síntoma:** El proveedor cortó la sesión a los 7 min con 429 FreeUsageLimitError (reintento en ~12 min); 3 commits hechos, sin reporte final ni compuerta; aes-oc.sh salió con 2 (fallo de jq al escribir) en vez de 4
- **Detectado por:** Orquestador (eventos jsonl)
- **Causa probable:** —
- **Control propuesto:** aes-oc.sh: tratar cualquier evento type=error como código 4 antes de procesar con jq; prever límite del plan gratuito
- **Aprobado por / fecha:** —
- **Verificado en:** —

## FL-003 — 2026-11-22
- **Agente / harness / modelo:** programmer / opencode/deepseek-v4.1-flash-free
- **Tarea / historia:** EN-001 / TASK-001 (R2, ciclo 1)
- **Síntoma:** Segundo corte por 429 FreeUsageLimitError durante R2 (ciclo 1); dejó el commit 86eafaa (sqlx 0.9, libsqlite3-sys 0.40, sin rsa) sin reporte ni compuerta; reintento en ~17 h
- **Detectado por:** aes-oc.sh (código 4)
- **Causa probable:** —
- **Control propuesto:** No depender del plan gratuito para tareas con compilación larga; binding alternativo acordado con el humano
- **Aprobado por / fecha:** —
- **Verificado en:** —

## FL-004 — 2026-11-24
- **Agente / harness / modelo:** orquestador / aes-oc.sh (Windows)
- **Tarea / historia:** EN-001
- **Síntoma:** aes-oc.sh salió con 2 tras un rol terminado: 'jq -r ... | head -n1' falla con 'writing output failed: Invalid argument' al cerrar head el pipe (pipefail + set -e); no se ejecutó la compuerta ni se registró el costo
- **Detectado por:** Orquestador (log, jsonl con step_finish stop)
- **Causa probable:** —
- **Control propuesto:** Usar 'jq ... | sed -n 1p' o 'jq -r first(...)' sin head; el orquestador ejecutó la compuerta a mano (OK) y extrajo el reporte del jsonl
- **Aprobado por / fecha:** —
- **Verificado en:** —

## FL-005 — 2026-11-24
- **Agente / harness / modelo:** mechanic / deepseek/deepseek-flash (OpenCode)
- **Tarea / historia:** EN-001 (cierre)
- **Síntoma:** BLOCKED en el cierre: opencode.json niega external_directory, así que no pudo leer .aes/*-pending.md del checkout principal (ruta absoluta de la plantilla M1); además la compuerta de fin de rol falló por servidores de la demo vivos en 5080/5173
- **Detectado por:** Mecánico (reporte BLOCKED)
- **Causa probable:** —
- **Control propuesto:** Con OpenCode, copiar .aes/*-pending.md al worktree (ignorado por git) antes de M1; pedir al humano detener los servidores de la demo antes del cierre
- **Aprobado por / fecha:** —
- **Verificado en:** —

## FL-006 — 2026-11-25
- **Agente / harness / modelo:** programmer / Claude Code (subagente) / claude-sonnet (nivel alto)
- **Tarea / historia:** US-001 TASK-001
- **Síntoma:** BLOCKED con todo lo demás en verde: `src/server/tests/health.rs:97` (prueba de EN-001) afirma exactamente 1 migración aplicada, la `0002_account.sql` que pide la tarea la deja en 2 y `cargo test` falla. El archivo figuraba en «Pruebas de regresión afectadas» de la tarea, pero no en su `.scope`, así que el programador no lo podía tocar
- **Detectado por:** Programador (reporte BLOCKED), antes de publicar
- **Causa probable:** Hueco de la nota de diseño del orquestador, no del rol. La nota listó las pruebas de regresión afectadas, pero no revisó cuáles **tienen que cambiar** por la tarea. Una prueba que afirma un conteo o una lista global (migraciones, rutas, textos del catálogo, tablas) se rompe con cualquier elemento nuevo de ese tipo
- **Control propuesto:** En la skill `aes-design-note` (revisión antes de publicar) y en la plantilla de tarea: cada archivo de «Pruebas de regresión afectadas» va en el `.scope` con la línea exacta que puede cambiar, o se justifica por qué no cambia. Antes de cerrar la nota, el orquestador busca en las pruebas existentes aserciones sobre conteos o listas globales de lo que la tarea agrega (`grep` de `migrat`, rutas, claves del catálogo). En el propio proyecto, estas aserciones comparan con el total real (`sqlx::migrate!(…).iter().count()`), no con un número fijo
- **Aprobado por / fecha:** — (lo pidió registrar GG_WellCoded, 2026-11-25, para tenerlo en cuenta en futuras mejoras de la metodología)
- **Verificado en:** —
