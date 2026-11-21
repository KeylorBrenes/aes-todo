---
name: aes-design-note
description: Cómo escribe el orquestador AES la nota de diseño de cada tarea T2/T3 (AES 10 §5), y cómo responde una pregunta de diseño del programador. Úsala al dividir una historia en tareas antes de Ready, o cuando un programador termina con BLOCKED por una duda de diseño.
---

# Nota de diseño (AES)

Eres el diseñador senior del equipo. El programador seguirá la nota al pie de la letra y no añadirá nada que no diga; el verificador revisará el diff contra ella. Lo que no escribas, no existe; lo que escribas con ambigüedad, se interpreta de la forma más fácil.

## 1. Reúne hechos (no descripciones)
- La historia, sus criterios y el contrato de interfaz.
- `docs/design-catalog.md`: patrones en uso y lo que ya se decidió **no** usar.
- Los ADR que apliquen.
- El resumen estructural de lo que toca la historia:
  `bash .claude/scripts/aes-outline.sh origin/dev <rutas>`
  Si el proyecto usa un grafo de código (por ejemplo, Graphify), consúltalo para dependencias e impactos, y cuenta como hechos **solo** las relaciones extraídas del código, no las inferidas.
- Si respondes a una pregunta del programador: su pregunta, más los mismos hechos. No su descripción de cómo está el código.

## 2. Decide el nivel 2 con una pregunta
Para cada posible patrón o abstracción (AES 10 §4):
1. ¿Qué **razón presente** lo justifica: variantes que ya existen, historias del backlog que lo piden o un ADR?
2. Si se respeta el nivel 1, ¿cuánto costaría añadirlo después?

Sin razón presente, o con un costo bajo de añadirlo después: **no se usa**, y se escribe en «Lo que no se hace». Elegir no usar un patrón es una decisión con el mismo peso que usarlo.

## 3. Escribe la nota (plantilla `templates/design-note.md`)
- **Piezas:** archivo, tipo o función; si es nueva o existente; **una** responsabilidad cada una.
- **Patrón:** el elegido con su razón presente, o «ninguno» y por qué basta el código directo.
- **Lo que no se hace:** una línea por tentación previsible. Por ejemplo: «no se crea interfaz para `ExpenseService`: una sola implementación», «no se generaliza el formulario para otras entidades», «no se toca `Program.cs` salvo para registrar el endpoint».
- **Nivel 1 donde no es obvio:** dónde termina la lógica y empieza la entrada/salida; qué dependencias se reciben y por dónde; dónde vive el acceso a datos de esta funcionalidad; en qué frontera se valida y a qué tipo se convierte.
- **Catálogo:** si la nota introduce un patrón o un «no» nuevo, anótalo para actualizar `docs/design-catalog.md` en el cierre.

## 4. Revisa antes de publicarla
- ¿Cada pieza tiene **una** responsabilidad, nombrada sin «y»?
- ¿Hay algún patrón sin razón presente? Quítalo.
- ¿Lo que no se hace cubre lo que un programador junior añadiría «por si acaso»?
- ¿La nota cabe en la superficie de cambio de la tarea? Si exige tocar más, la superficie o la división en tareas está mal.
- ¿Contradice el catálogo o un ADR? Entonces es una decisión nueva: regístrala (D-NN) o propón un ADR.

## Lo que esta skill no hace
No decide requisitos (son del humano), no lee implementaciones para decidir, y no sustituye al verificador: él comprueba que el código siga la nota.
