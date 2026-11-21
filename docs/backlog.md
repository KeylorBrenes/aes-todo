# Backlog — aes-todo (nombre provisional)

Única fuente de verdad del backlog (AES 02 §11). Las vistas (tablero HTML, GitHub Projects, Trello…) se generan desde aquí, en una sola dirección. Los cambios entran por PR.

**Visión:** una lista de tareas personal, protegida con contraseña, que guarda todo en el servidor para que nada se pierda al cerrar o borrar el navegador, organiza las tareas en proyectos con subtareas y etiquetas, y mide cuánto tardó cada una desde que se inició hasta que se completó.
**Stack:** Rust (Axum + SQLx) + SQLite; web con React + TypeScript + Vite (ADR-001)

## Releases
| Release | Objetivo (lo que el usuario ya puede hacer) | Estado |
|---|---|---|
| REL-001 | Entrar con su contraseña, anotar, editar y eliminar tareas que no se pierden, y ver cuánto tardó en completar cada una (en local) | En curso |
| REL-002 | Organizar las tareas en proyectos con subtareas y etiquetas de color, reabrirlas y recuperar lo eliminado | Previsto |
| REL-003 | Usar la app desde cualquier equipo por internet, en modo oscuro o en inglés, con respaldo diario | Previsto |

Solo el release en curso está comprometido; los siguientes son una previsión (AES 02 §12).

## Elementos
| ID | Tipo | Epic | Título | Requiere | Puntos | Prioridad | Release | Severidad | Estado |
|---|---|---|---|---|---|---|---|---|---|
| EN-001 | Enabler | — | Para que las historias se puedan probar de punta a punta, necesitamos el servidor Axum con SQLite entregando la web React, con una prueba de punta a punta y la CI en verde | — | 3 | P0 | REL-001 | — | Draft |
| US-001 | Historia | Acceder | Como dueño de la app, quiero crear mi cuenta la primera vez que la abro, para que nadie más pueda reclamarla | EN-001 | 2 | P1 | REL-001 | — | Draft |
| US-002 | Historia | Acceder | Como dueño de la app, quiero iniciar sesión con mi usuario y contraseña, para que solo yo vea mis tareas | US-001 | 3 | P1 | REL-001 | — | Draft |
| US-003 | Historia | Acceder | Como dueño de la app, quiero cerrar sesión, para que nadie use mi cuenta en un equipo que no es mío | US-002 | 1 | P1 | REL-001 | — | Draft |
| US-004 | Historia | Gestionar tareas | Como dueño de la app, quiero crear una tarea con un texto, para no olvidar lo que tengo que hacer | US-002 | 2 | P1 | REL-001 | — | Draft |
| US-005 | Historia | Gestionar tareas | Como dueño de la app, quiero ver mis tareas con su fecha de creación, para saber qué tengo pendiente y desde cuándo | US-004 | 2 | P1 | REL-001 | — | Draft |
| US-006 | Historia | Gestionar tareas | Como dueño de la app, quiero editar el texto de una tarea, para corregirla o precisarla | US-005 | 2 | P1 | REL-001 | — | Draft |
| US-007 | Historia | Gestionar tareas | Como dueño de la app, quiero eliminar una tarea, para quitar de mi lista lo que ya no aplica sin perderlo del todo | US-005 | 2 | P1 | REL-001 | — | Draft |
| US-008 | Historia | Medir el tiempo | Como dueño de la app, quiero iniciar una tarea, para que empiece a contar el tiempo que me toma | US-005 | 2 | P1 | REL-001 | — | Draft |
| US-009 | Historia | Medir el tiempo | Como dueño de la app, quiero completar una tarea y ver cuánto duró, para saber cuánto me tomó de verdad | US-008 | 3 | P1 | REL-001 | — | Draft |
| US-010 | Historia | Organizar en proyectos | Como dueño de la app, quiero agregar subtareas a una tarea, para dividir un proyecto en pasos pequeños | US-005 | 3 | P2 | REL-002 | — | Draft |
| US-011 | Historia | Organizar en proyectos | Como dueño de la app, quiero ver cuántas subtareas de un proyecto llevo completas, para saber cuánto me falta | US-010, US-009 | 2 | P2 | REL-002 | — | Draft |
| US-012 | Historia | Organizar en proyectos | Como dueño de la app, quiero que una tarea padre se complete sola al completar todas sus subtareas, para no tener que marcarla a mano | US-011 | 3 | P2 | REL-002 | — | Draft |
| US-013 | Historia | Organizar en proyectos | Como dueño de la app, quiero ver cuánto duró un proyecto completo, para saber cuánto me tomó en total | US-012 | 2 | P2 | REL-002 | — | Draft |
| US-014 | Historia | Medir el tiempo | Como dueño de la app, quiero reabrir una tarea completada, para corregir si la marqué por error | US-009 | 2 | P2 | REL-002 | — | Draft |
| US-015 | Historia | Gestionar tareas | Como dueño de la app, quiero ver la papelera, para saber qué eliminé | US-007 | 2 | P2 | REL-002 | — | Draft |
| US-016 | Historia | Gestionar tareas | Como dueño de la app, quiero restaurar una tarea de la papelera, para recuperar lo que eliminé por error | US-015 | 2 | P2 | REL-002 | — | Draft |
| US-017 | Historia | Gestionar tareas | Como dueño de la app, quiero borrar definitivamente una tarea de la papelera, para deshacerme de lo que ya no quiero guardar | US-015 | 2 | P2 | REL-002 | — | Draft |
| US-018 | Historia | Etiquetar | Como dueño de la app, quiero crear una etiqueta con un color, para clasificar mis tareas a mi manera | US-002 | 3 | P2 | REL-002 | — | Draft |
| US-019 | Historia | Etiquetar | Como dueño de la app, quiero ponerle una o varias etiquetas a una tarea, para distinguirla a simple vista | US-018, US-005 | 3 | P2 | REL-002 | — | Draft |
| US-020 | Historia | Etiquetar | Como dueño de la app, quiero cambiar el nombre o el color de una etiqueta, para ajustar mi clasificación | US-018 | 2 | P2 | REL-002 | — | Draft |
| US-021 | Historia | Etiquetar | Como dueño de la app, quiero eliminar una etiqueta, para quitar las que ya no uso | US-019 | 2 | P2 | REL-002 | — | Draft |
| US-022 | Historia | Personalizar | Como dueño de la app, quiero usarla en modo oscuro, para trabajar cómodo con poca luz | EN-001 | 3 | P3 | REL-003 | — | Draft |
| US-023 | Historia | Personalizar | Como dueño de la app, quiero usarla en inglés, para elegir el idioma en que la leo | EN-001 | 3 | P3 | REL-003 | — | Draft |
| SP-001 | Spike | Operar | Para publicar la app, necesitamos decidir dónde corre (plataforma, costo, disco persistente, HTTPS) | EN-001 | 2 | P3 | REL-003 | — | Draft |
| EN-002 | Enabler | Operar | Para que los datos no se pierdan aunque falle el servidor, necesitamos un respaldo diario automático de la base de datos que se pueda restaurar | SP-001 | 3 | P3 | REL-003 | — | Draft |
| EN-003 | Enabler | Operar | Para abrir la app desde cualquier equipo, necesitamos publicarla en internet con HTTPS | SP-001, EN-002 | 5 | P3 | REL-003 | — | Draft |

## Epics
| Epic | Lo que el usuario hace |
|---|---|
| Acceder | Crea su única cuenta, entra con su contraseña y cierra la sesión |
| Gestionar tareas | Crea, ve, edita y elimina tareas; recupera o borra lo eliminado desde la papelera |
| Medir el tiempo | Inicia una tarea, la completa y ve cuánto duró (días, horas, minutos, segundos); la reabre si se equivocó |
| Organizar en proyectos | Agrupa subtareas bajo una tarea padre (dos niveles) y ve su avance y su duración |
| Etiquetar | Crea etiquetas de color y se las pone a sus tareas |
| Personalizar | Elige modo oscuro e idioma (español o inglés) |
| Operar | La app corre en internet con respaldo diario |

## Notas
- US-001: solo puede existir una cuenta; después de creada, la pantalla de crear cuenta deja de estar disponible.
- US-005: cada tarea guarda fecha de creación, de inicio y de fin. Textos de la interfaz preparados para traducción desde aquí (lo usa US-023).
- US-007: desde REL-001 eliminar es un borrado lógico (la tarea va a la papelera); ver y restaurar llega con US-015/US-016. Al eliminar una tarea padre se van sus subtareas, con aviso de cuántas son (se precisa en US-010).
- US-009: la duración va del inicio al fin, sin pausas; se muestra en días, horas, minutos y segundos.
- US-012: si se agrega o reabre una subtarea, la tarea padre vuelve a pendiente; una tarea padre sin subtareas se completa a mano.
- US-013: la duración de una tarea padre va del primer inicio de sus subtareas a la última completada.
- US-014: al reabrir se borra la fecha de fin y se conserva la de inicio.
- US-022: el modo oscuro es una restricción no negociable de la interfaz; la dirección visual (DESIGN.md) debe contemplarlo desde el principio.
