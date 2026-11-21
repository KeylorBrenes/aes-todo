# Backlog — [Proyecto]

Única fuente de verdad del backlog (AES 02 §11). Las vistas (tablero HTML, GitHub Projects, Trello…) se generan desde aquí, en una sola dirección. Los cambios entran por PR.

**Visión:** [una o dos frases: qué problema resuelve el producto y para quién]
**Stack:** [p. ej. .NET 10 + EF Core + SQLite, React + TypeScript + Vite]

## Releases
| Release | Objetivo (lo que el usuario ya puede hacer) | Estado |
|---|---|---|
| REL-001 | [p. ej. registrar sus gastos y ver cuánto lleva en el mes] | En curso |
| REL-002 | [p. ej. organizar los gastos por categoría] | Previsto |

Solo el release en curso está comprometido; los siguientes son una previsión (AES 02 §12).

## Elementos
| ID | Tipo | Epic | Título | Requiere | Puntos | Prioridad | Release | Severidad | Estado |
|---|---|---|---|---|---|---|---|---|---|
| EN-001 | Enabler | — | Para que las historias se puedan probar de punta a punta, necesitamos la app arrancando con base de datos, API y web | — | 3 | P0 | REL-001 | — | Draft |
| US-001 | Historia | Registrar gastos | Como usuario, quiero registrar un gasto, para saber en qué se va mi dinero | EN-001 | 3 | P1 | REL-001 | — | Draft |
| US-002 | Historia | Consultar gastos | Como usuario, quiero ver mis gastos del mes, para saber cuánto llevo gastado | US-001 | 2 | P1 | REL-001 | — | Draft |
| US-003 | Historia | Registrar gastos | Como usuario, quiero asignar una categoría a un gasto, para saber en qué tipo de cosas gasto más | US-001 | 2 | P2 | REL-002 | — | Draft |

## Epics
| Epic | Lo que el usuario hace |
|---|---|
| Registrar gastos | [una frase] |
| Consultar gastos | [una frase] |

## Notas
[Opcional: una línea por elemento con el valor esperado o un riesgo, mientras está en Draft. El detalle va en `specs/<ID>/` cuando le toca.]
