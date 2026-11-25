# Nota de diseño — [US-NNN] / [TASK-NNN]

[La escribe el orquestador (10 §5) a partir de hechos: historia, contrato de interfaz, ADRs, `docs/design-catalog.md` y el resumen estructural generado por herramienta. Va dentro de la especificación de la tarea.]

## Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| | | |

## Patrón (nivel 2)
- **Se usa:** [patrón] — razón presente: [variantes reales, historias del backlog o ADR]
- o **Ninguno**: [por qué basta con código directo]

## Lo que no se hace
- No se crea [interfaz / capa / abstracción / generalización] para [X]: [motivo]
- No se toca [módulo]: [motivo]

## Nivel 1 donde no es obvio
[Dónde termina la lógica y empieza la entrada/salida; qué dependencias se reciben por parámetro; dónde vive el acceso a datos de esta funcionalidad.]

## Bordes de la API (solo si la tarea añade o cambia rutas)
[Lo que el framework decide por defecto y el contrato debe fijar. Una fila por prefijo o ruta nueva.]

| Ruta o prefijo | Método no permitido | Ruta desconocida y barra final | Cuerpo de error | Qué lo cubre (fallback, middleware) |
|---|---|---|---|---|
| | [405 + cuerpo uniforme] | [404 + cuerpo uniforme; `/prefijo/` incluido] | [forma del contrato] | |

## Comportamiento dinámico de la interfaz (solo si la tarea tiene UI)
[El verificador comprueba esto con teclado, lector de pantalla y ratón. Lo que no se diga aquí lo decidirá el programador, y cada diferencia con lo esperado será un ciclo FAIL.]

| Transición de estado (qué la causa) | Dónde queda el foco | Qué se anuncia y en qué región viva | Anillo de foco visible |
|---|---|---|---|
| [carga inicial] | | | |
| [acción con éxito] | [control / elemento de estado con `tabIndex={-1}` / no se mueve] | | [sí con teclado y ratón / solo con teclado (`:focus-visible`) / no: elemento no interactivo] |
| [acción con error] | | | |

- **Regiones vivas:** [cuáles están siempre montadas desde la carga y cuáles se insertan; una sola `role="status"` por región; un `alert` no contiene controles].
- **Anillo por tipo de elemento** según `DESIGN.md`: [controles / elementos de estado enfocados por programa].
- **Espacio reservado:** [si un mensaje aparece y desaparece, si ocupa espacio cuando está vacío].
- **Respuestas que la prueba técnica debe cubrir:** [éxito, error del servidor, red caída, éxito con cuerpo inesperado o no JSON].

## ¿Cambia el catálogo de diseño?
No / Sí: [qué se añade en el cierre]
