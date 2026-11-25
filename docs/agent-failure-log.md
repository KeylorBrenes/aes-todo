# Agent Failure Log — aes-todo

Registro de fallos observados en agentes y de los controles añadidos para evitarlos (AES 09). Se registran hechos observables, no juicios sobre el modelo.

## Patrones activos
| Patrón | Entradas | Control aplicado | Capa | Estado |
|---|---|---|---|---|
| | | | L1 / L2 / L3 / skill / AGENTS.md | Propuesto / Aprobado / Verificado |

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
