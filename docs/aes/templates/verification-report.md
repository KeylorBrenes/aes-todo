# Independent Verification Report — US/TASK-[ID]

- **Verificador (harness/modelo):**
- **Sesión nueva y de solo lectura:** Sí / No
- **Fecha:**
- **Commit/diff exacto:**
- **Especificación y versión:**
- **Track:**
- **Resultado:** PASS / FAIL / BLOCKED

## Diseño
- ¿El diff sigue la nota de diseño (piezas, responsabilidades, patrón, lo que no se hace)?
- ¿Síntomas del nivel 1 (AES 10 §3)? Lista los encontrados con archivo y línea.

## Puntos de atención recibidos
[Hechos que el orquestador señaló. Se comprueban como hipótesis, no se aceptan como conclusiones.]

## Alcance verificado
[Historia, tareas, criterios, contrato de interfaz y rutas revisados.]

## Evidencia re-ejecutada
| Criterio / control | Método (comando o herramienta) | Resultado | Evidencia (salida, captura, artefacto) |
|---|---|---|---|
| Aceptación visible | | | |
| Aceptación holdout | | | |
| Unitarias/integración | | | |
| Lint/tipos/seguridad | | | |

## Guardián de CI
- Superficie de cambio respetada: Sí / No (archivos fuera):
- Rutas protegidas intactas: Sí / No
- Marcadores de trampa: Ninguno / [lista y justificación]
- Dependencias nuevas:

## Señales de desvío (Beck)
| Señal | ¿Presente? | Evidencia |
|---|---|---|
| Bucles o código repetitivo innecesario | | |
| Funcionalidad no pedida | | |
| Pruebas desactivadas, borradas o debilitadas | | |

## Prueba manual agéntica
[Cómo se arrancaron los servidores (con la herramienta que los detiene al terminar), qué flujos se ejercitaron, **con datos distintos a los de las pruebas**, capturas y salida literal. Sin prueba manual, cuando el track la exige, el resultado es BLOCKED.]

## Hallazgos
Cada afirmación se comprobó en su fuente (00 §7): contenido versionado con `git show`/`git cat-file`, comportamiento en el código o ejecutándolo.

| ID | Origen | Tipo | Severidad propuesta | Hallazgo | Reproducción/evidencia | Criterio o regla incumplida |
|---|---|---|---|---|---|---|
| F-1 | De la tarea / preexistente | Defecto / Hueco de la especificación | Crítica / Alta / Media / Menor | | | |

- **Origen.** «De la tarea»: sobre lo que añade la tarea. «Preexistente»: comportamiento ya aceptado o anterior → defecto del backlog con severidad.
- **Tipo.** «Defecto»: el código incumple algo escrito (criterio, nota de diseño, DoD, `DESIGN.md`, ADR); cita la regla. «Hueco de la especificación»: el código hace algo razonable que nada escrito decide; propón qué debería decir la nota o el catálogo.
- Qué se hace con cada uno lo decide la regla de 02 §9.3, no el verificador.

## Commits
[¿Separan estructural y conductual? ¿Algún `struct:` cambia comportamiento?]

## Cambios fuera de alcance
[Indicar ninguno o enumerarlos.]

## Entorno al terminar
[Sin servidores ni procesos del verificador escuchando (06 §10).]

## Riesgos y aspectos no verificados

## Conclusión
[Justificar PASS/FAIL/BLOCKED. PASS solo si todos los criterios obligatorios tienen evidencia re-ejecutada suficiente. Para fallos holdout, el mensaje al programador incluye solo el ID del criterio y el comportamiento observado.]
