# Agent Failure Log — [Proyecto]

Registro de fallos observados en agentes y de los controles añadidos para evitarlos (AES 09). Se registran hechos observables, no juicios sobre el modelo.

## Patrones activos
| Patrón | Entradas | Control aplicado | Capa | Estado |
|---|---|---|---|---|
| | | | L1 / L2 / L3 / skill / AGENTS.md | Propuesto / Aprobado / Verificado |

---

## FL-[NNN] — YYYY-MM-DD
- **Agente / harness / modelo:**
- **Tarea / historia:**
- **Síntoma:** [qué hizo el agente]
- **Detectado por:** [CI, guardián, verificador, revisión humana]
- **Causa probable:** [qué faltaba en la tarea, el contexto o los controles]
- **Control propuesto:** [en orden de dureza: CI → hook → permiso → skill → línea en AGENTS.md]
- **Aprobado por / fecha:**
- **Verificado en:** [tarea posterior donde no se repitió]

### Ejemplo

## FL-007 — 2026-11-02
- **Agente / harness / modelo:** programador / OpenCode / [modelo]
- **Tarea / historia:** TASK-014 (US-005)
- **Síntoma:** añadió paginación no pedida al listado de notificaciones.
- **Detectado por:** verificador (señal «funcionalidad no pedida»).
- **Causa probable:** la tarea no tenía «Fuera de alcance» explícito.
- **Control propuesto:** la DoR de tarea exige «Fuera de alcance» no vacío en T2/T3.
- **Aprobado por / fecha:** responsable humano, 2026-11-02.
- **Verificado en:** TASK-019, sin recurrencia.
