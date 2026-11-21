# Acceptance Test Plan — [US/EN/BUG/ST]-[NNN]

- **Versión de la historia:**
- **Track:** T1 / T2 / T3
- **Preparado por:** QA / Test Designer
- **Estado:** Draft / Approved / Protected

## Fuente contractual
[Enlace o referencia exacta a historia, criterios aprobados y contrato de interfaz.]

## Matriz de trazabilidad
Cada prueba lleva las etiquetas del elemento y del criterio (`@US-[NNN]`, `@US-[NNN]-AC-NN`) y el ID del criterio al inicio del título. Toda prueba se deriva de un criterio aprobado.

| Criterio | Prueba (título) | Tipo | Visible/holdout | Automatizado/manual | Evidencia esperada |
|---|---|---|---|---|---|

## Pruebas de caracterización
[Criterios cuyo comportamiento ya existe: no pueden demostrar RED. Viven en la suite de la historia dueña, con su etiqueta, y corren en la regresión (05 §2.4). Omitir si no hay.]

| Criterio nuevo | Prueba | Suite / etiqueta dueña | Motivo |
|---|---|---|---|

## Escenarios
Para cada escenario documentar precondiciones, datos sintéticos, acción (a través del contrato de interfaz), resultado esperado y limpieza.

Aislamiento (05 §2.5): cada prueba crea sus datos y los busca por una marca propia; no compara conteos ni totales globales; no depende del orden ni de un modo serie.

## Casos negativos y límites

## Seguridad/autorización

## Regresión relevante

## Automatización y entorno
[Framework, comandos, dependencias y configuración.]

## Supuestos que requieren decisión
[Todo lo que hubo que suponer porque el contrato no lo dice: tipo de control, formato, comportamiento en un caso límite. El orquestador los lleva al humano antes de `Ready`; cada respuesta es una decisión D-NN de la historia. Ninguno queda abierto.]

| # | Supuesto | Prueba(s) afectada(s) | Decisión (D-NN) |
|---|---|---|---|

## RED confirmado
Ejecución contra la rama base antes de implementar, comprobada por la herramienta que usa la CI: **todas** las pruebas nuevas se ejecutaron y fallaron, y cada una por la razón esperada.

| Escenario | Resultado contra base | Razón del fallo | ¿Es la razón esperada? |
|---|---|---|---|
| | FAIL | [p. ej. 404 en `/api/notifications`] | Sí |

- Comando:
- Salida de la herramienta de RED (literal):
- Commit base:
- Artefacto/salida:

## Protección
- Ubicación de suite visible:
- Ubicación de suite holdout (no accesible al programador):
- Commit/branch confiable:
- Mecanismo de protección (L3):
- Quién puede aprobar cambios:

## Aprobación
- QA:
- Responsable humano que aprobó criterios **y pruebas**:
- Fecha/commit de baseline:
