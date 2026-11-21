# US-[NNN] — Como [tipo de usuario], quiero [capacidad], para [beneficio]

[La historia es para el responsable humano y se conserva. Se escribe en lenguaje de cliente: qué se logra y cómo se comprueba, sin tablas, clases, endpoints ni patrones (03 §1). Lo técnico va en el plan técnico (`technical-plan.md`), que se elimina en el cierre.
Para enablers, el título es «EN-[NNN] — Para [objetivo], necesitamos [capacidad técnica]». Para defectos, chores y lotes de estabilización usa `defect.md` y `stabilization-batch.md`.]

- **Requiere:** US-[MMM] / —
- **Epic:** EPIC-[NNN]
- **Track:** T2 / T3
- **Estado:** Draft / Ready / In Progress / In Review / Blocked / Ready for Acceptance / Accepted / Released / Rejected / Deferred
- **Prioridad:** P0 / P1 / P2 / P3
- **Story Points:** 1 / 2 / 3 / 5 [8 o más: dividir antes de refinar, 02 §3.1]
- **Riesgo:** Low / Medium / High / Critical
- **Aprobador de producto:**

## Contexto y reglas
[En términos del negocio: por qué importa y qué reglas aplican.]

## Criterios de aceptación
[Dado / Cuando / Entonces, en lenguaje del usuario. Cada acción que guarda, edita, elimina o envía tiene un criterio de fallo: qué ve el usuario si no se pudo y qué lo quita (03 §3).]

| ID | Dado | Cuando | Entonces | Se comprueba con |
|---|---|---|---|---|
| AC-01 | que soy un visitante | me registro con un email válido y una contraseña de al menos 8 caracteres | mi cuenta queda creada y entro a la app con la sesión iniciada | Prueba de aceptación |
| AC-02 | | | | Regresión de US-[MMM] (el comportamiento ya existe, 05 §2.4) |

## Fuera de alcance
[Obligatorio y no vacío. Lo que alguien podría esperar de esta historia y no se hace aquí, con la historia que lo cubrirá si existe.]

## Plan
[Cómo se va a construir, contado como a un cliente: qué podrá hacer el usuario al terminar cada paso. Sin detalles técnicos.]

## Sugerencias del orquestador
[Qué considera el mejor camino y por qué; qué alternativas descartó. En lenguaje de cliente.]

## Decisiones
[Cada ambigüedad resuelta y cada supuesto de QA convertido en contrato (03 §8). Entra en el mismo PR que la usa. Ningún supuesto queda abierto al pasar a `Ready`.]

| ID | Pregunta | Opciones | Decisión | Quién y fecha | Impacto |
|---|---|---|---|---|---|
| D-01 | | | | | Criterio nuevo/modificado, ADR o «ninguno» |

## Riesgos

## Cierre
- Aceptación humana (fecha):
- Defectos registrados (ID y severidad):
- Qué se consolidó del plan técnico (catálogo de diseño, ADR):

## Historial de cambios
| Fecha | Cambio | Motivo | Aprobador |
|---|---|---|---|
