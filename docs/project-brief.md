# Project Brief — aes-todo (nombre provisional)

## Problema y oportunidad
El responsable del producto lleva hoy sus tareas en papel o en notas sueltas. Le duele sobre todo perderlas, y además no puede agrupar las tareas de un proyecto (por ejemplo, «Proyecto Rust» y sus pasos), ni saber cuánto tardó de verdad en completar cada una. Quiere una herramienta ligera, con una interfaz limpia, que guarde todo de forma segura: los datos tienen que sobrevivir a cerrar el navegador, a borrarlo y a abrir la app desde otro navegador o equipo.

## Usuarios y actores
- **Dueño de la app:** una sola persona, que es el responsable del producto. Usa la app desde la computadora y desde el celular, en el navegador.
- No hay otros usuarios, administradores ni sistemas externos.

## Objetivos y señales de éxito
- **No se pierde nada:** lo anotado sigue ahí al cerrar o borrar el navegador, o al entrar desde otro, y lo eliminado se puede recuperar.
- **Solo el dueño ve sus tareas:** sin sesión iniciada no se ve ni se cambia nada.
- **El dueño sabe cuánto tardó:** cada tarea completada muestra su duración real, del inicio al fin.
- **El papel deja de hacer falta:** el dueño usa la app como su única lista de tareas.

## Alcance inicial
REL-001: una cuenta única con contraseña; crear, ver (con fecha de creación), editar y eliminar tareas (eliminar las manda a la papelera); iniciar una tarea y completarla viendo cuánto duró. Corre en local y los datos se guardan en el servidor (SQLite).

## Fuera de alcance
- Varios usuarios, tareas compartidas o colaboración.
- App nativa para el celular (la web se adapta a la pantalla).
- Pausar el conteo del tiempo de una tarea.
- Más de dos niveles de tareas (una subtarea no tiene subtareas).
- Fechas límite, recordatorios, notificaciones e integraciones con calendarios u otros servicios.

## Releases previstos
| Release | Objetivo (lo que el usuario ya puede hacer) | Epics que toca |
|---|---|---|
| REL-001 | Entrar con su contraseña, anotar, editar y eliminar tareas que no se pierden, y ver cuánto tardó en completar cada una (en local) | Acceder, Gestionar tareas, Medir el tiempo |
| REL-002 | Organizar las tareas en proyectos con subtareas y etiquetas de color, reabrirlas y recuperar lo eliminado | Organizar en proyectos, Etiquetar, Gestionar tareas, Medir el tiempo |
| REL-003 | Usar la app desde cualquier equipo por internet, en modo oscuro o en inglés, con respaldo diario | Personalizar, Operar |

El detalle (qué historias entran) está en `docs/backlog.md`.

## Restricciones
- **Privacidad y acceso:** una sola cuenta con usuario y contraseña (hash Argon2id). La sesión dura en cada navegador hasta que el dueño la cierra.
- **Persistencia:** los datos viven en el servidor, no en el navegador. Respaldo diario automático (REL-003).
- **Dispositivos:** navegador de escritorio y de celular (diseño adaptable).
- **Idioma:** español en REL-001 y REL-002, con los textos preparados para traducir; inglés en REL-003. Tono neutro e impersonal («No hay tareas pendientes»).
- **Accesibilidad:** WCAG 2.2 AA.
- **Interfaz:** limpia y con varios colores; el modo oscuro es obligatorio (llega como historia en REL-003, pero la dirección visual lo contempla desde el principio).
- **Stack:** Rust en el servidor (ADR-001).
- **Operación:** el código lo mantienen los agentes AES y el humano aprueba los cambios. Sin plazo.

## Supuestos e incertidumbres («por definir»)
| Elemento | Tipo (supuesto/incertidumbre) | Impacto | Cómo y cuándo se resuelve (pregunta, Spike, historia) |
|---|---|---|---|
| Dónde corre la app en internet | Incertidumbre | Costo, cómo se respalda y cómo se publica | SP-001, antes de EN-002/EN-003 (REL-003) |
| Qué pasa si el dueño olvida la contraseña | Incertidumbre | Sin un mecanismo, perdería el acceso a sus datos | Pregunta al humano en el refinamiento de US-002; probablemente un comando de restablecimiento en el servidor |
| Nombre y logo de la app | Incertidumbre | Textos y marca de la interfaz | Pregunta al humano; mientras tanto se usa el nombre provisional |
| Filtrar o buscar tareas por etiqueta | Incertidumbre (no se pidió) | Utilidad de las etiquetas cuando haya muchas tareas | Se decide al cerrar REL-002 |
| Al restaurar una tarea padre vuelven sus subtareas | Supuesto | Comportamiento de la papelera | Se confirma en el refinamiento de US-016 |
| La duración se muestra en la zona horaria del navegador | Supuesto | Cómo se presentan las fechas | Se confirma en el refinamiento de US-005 |

## Riesgos iniciales
| Riesgo | Probabilidad/impacto | Mitigación o investigación |
|---|---|---|
| Pérdida de datos por un fallo del disco o del servidor | Media / Alto | SQLite en modo WAL; respaldo diario y restauración probada (EN-002) |
| Acceso indebido a la cuenta | Baja / Alto | Argon2id, cookie de sesión HttpOnly, Secure y SameSite, límite de intentos de inicio de sesión (US-002), HTTPS al publicar (EN-003) |
| Agentes menos fluidos en Rust que en TypeScript | Media / Medio | Crates muy usados (Axum, SQLx), `clippy -D warnings` en la CI y pruebas de aceptación de punta a punta con Playwright |
| La plataforma de despliegue no tiene disco persistente para SQLite | Media / Medio | SP-001 lo evalúa antes de publicar |

## Aprobaciones
- Responsable del producto: GG_WellCoded
- PR de incepción (o de la última mini-incepción): pendiente
- Fecha/versión aprobada: pendiente
