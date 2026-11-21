# TASK-[NNN] — [Resultado concreto]

- **Historia/Enabler/Bug/Lote:** US-[NNN]
- **Track:** T0 / T1 / T2 / T3
- **Estado:** Ready / In Progress / In Review / Blocked / Done
- **Agente asignado:** programador / mecánico
- **Riesgo:** Low / Medium / High / Critical
- **Ciclos FAIL acumulados:** 0 / 3 (circuit breaker al llegar a 3)

## Objetivo y resultado esperado
[Un resultado principal, observable.]

## Alcance
[Qué sí debe cambiar.]

## Fuera de alcance
[Qué no debe cambiar. Obligatorio y no vacío en T2/T3. Nombrar funcionalidades cercanas que podrían implementarse «por conveniencia».]

## Criterios que deja en verde
[IDs de criterio o de defecto. Se publican en la rama protegida como `specs/US-[NNN]/TASK-[NNN].criteria`, uno por línea (`AC-03`, `BUG-012`). La CI de la tarea ejecuta solo esos más la regresión. La **última** tarea del elemento no lleva este archivo: ejecuta el elemento completo. Un criterio verificado por regresión de otra historia (caracterización) no se lista.]

## Contexto técnico
[Componentes, archivos conocidos, convenciones, ADRs.]

## Superficie de cambio
Publicada en la rama protegida como `specs/US-[NNN]/TASK-[NNN].scope` (un glob por línea). Cualquier archivo fuera de esta lista hace fallar la CI.

```
src/[modulo]/**
tests/unit/[modulo]/**
```

## Restricciones y permisos
[Rutas protegidas adicionales, dependencias autorizadas, operaciones que requieren aprobación.]

## Nota de diseño
[T2/T3: copia o enlace a la nota (plantilla `design-note.md`). El programador no añade patrones, abstracciones ni piezas que la nota no contemple.]

## Estados que introduce
[Si la tarea crea un estado (error, carga, edición, confirmación): qué lo crea y qué transiciones lo limpian. Omitir si no aplica.]

## Dependencias

## Comandos de validación exactos
```
[comando de pruebas unitarias del módulo]
[comando de pruebas de aceptación filtrado por US-NNN]
[lint] && [typecheck]
```

## Pruebas de regresión afectadas (test map)
[Archivos de prueba existentes que este cambio puede romper.]

## Presupuesto de diff orientativo
- Producción: ~N líneas
- Pruebas: ~M líneas
[El desvío que exige justificación es el de producción.]

## Condición de finalización
[Qué evidencia permite pasar a revisión.]

## Reporte de ejecución
- Baseline inicial (pruebas que ya fallaban):
- Cambios realizados:
- Commits (`struct:` / `feat:` / `fix:` / `test:`):
- Pruebas ejecutadas y resultados (salida capturada, no resumen):
- Comandos y entorno:
- Alertas del guardián de CI y su justificación:
- Supuestos/decisiones:
- Desviaciones/bloqueos:
- Riesgos pendientes:
- Entorno limpio al terminar (sin servidores ni procesos del rol):
- Referencia del diff/commit:
