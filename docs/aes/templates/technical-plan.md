# Plan técnico — [US-NNN]

[Para los agentes: orquestador, QA, programador y verificador (03 §1.2). El responsable humano no necesita leerlo para aprobar la historia. Se **elimina en el cierre**, después de pasar al catálogo de diseño o a un ADR lo que tenga valor para historias futuras. Las pruebas de aceptación y los comandos de verificación no son parte del plan: se conservan.]

- **Historia:** [US-NNN](US-NNN.md)
- **Resumen estructural usado:** `aes-outline.sh <ref> <rutas>` en [commit]

## Contrato de interfaz
[Punto de entrada observable contra el que se escriben las pruebas de aceptación (05 §2.1). Omitir solo si la historia no toca ninguna frontera observable.]

| Tipo | Definición |
|---|---|
| API / CLI / UI / librería | [p. ej. `POST /api/payments` → 201 `{id, amount, dueDate}`; 400 con `errors` por campo; formulario `data-testid="payment-form"`] |

## Corte vertical
[Qué parte mínima de cada capa necesita esta historia: migración, servidor, interfaz. Nada de otras historias.]

## Tareas (3 como máximo, 04 §3)
| ID | Resultado | Criterios que deja en verde | Superficie | Agente |
|---|---|---|---|---|
| TASK-001 | | AC-01, AC-02 | `TASK-001.scope` | programmer |

[Cada tarea tiene su archivo `TASK-NNN.md` con la nota de diseño (`design-note.md`), su `.scope` y, salvo la última, su `.criteria`.]

**Criterios que verifican el harness** (la CI, `validate.sh`, `aes.env`, un workflow): sus cambios no van en el PR `qa/<ID>`, porque harían pasar su propio comando de verificación y la CI rechazaría el RED. Van en un PR `spec/<ID>-ci` **entre** `qa/<ID>` y la primera tarea, que prepara el orquestador (rutas protegidas). Indícalo aquí:

| Criterio | Archivos del harness que cambia | PR |
|---|---|---|
| | | `spec/<ID>-ci` |

## Riesgos técnicos y preguntas abiertas

## Para consolidar en el cierre
- Catálogo de diseño:
- ADR:
