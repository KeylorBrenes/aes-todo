# 08 — Definition of Ready y Definition of Done

Los proyectos SHOULD copiar estas checklists dentro de su repositorio (01 §2), para que los agentes las tengan sin salir de él.

## 1. Definition of Ready (DoR) — Historia de Usuario o Enabler (T2/T3)

Una historia puede pasar a `Ready` cuando:

- [ ] **la compuerta de estabilización está abierta**: no hay defectos abiertos de severidad Crítica, Alta o Media, y los Menores no superan el límite del perfil (02 §9);
- [ ] el título tiene el formato de su tipo («Como… quiero… para…» en historias; «Para…, necesitamos…» en enablers) y declara `Requiere:` (02 §3);
- [ ] la historia es **atómica** (una capacidad que se demuestra sola) y un **corte vertical** (02 §3.1–3.2), con menos de 8 puntos;
- [ ] la historia está escrita en lenguaje de cliente; el detalle técnico está en el plan técnico (03 §1);
- [ ] alcance y exclusiones relevantes están definidos;
- [ ] criterios de aceptación son observables y verificables;
- [ ] cada acción que escribe tiene criterio de fallo (03 §3);
- [ ] ambigüedades materiales están resueltas y **registradas como decisiones** (03 §8);
- [ ] **ningún supuesto de QA queda abierto**: cada uno es contrato o se rechazó (03 §5);
- [ ] dependencias y riesgos relevantes están identificados;
- [ ] prioridad, Story Points y track están asignados;
- [ ] existe estrategia de aceptación y pruebas;
- [ ] decisiones arquitectónicas necesarias están aprobadas; las convenciones que valen para más de una historia están en un ADR;
- [ ] el contrato de interfaz está definido cuando la historia toca una frontera observable;
- [ ] la suite de aceptación está escrita, aprobada por el responsable humano y protegida;
- [ ] cada prueba lleva el ID de la historia y el de su criterio, y se deriva de un criterio aprobado (03 §6);
- [ ] **RED confirmado** por herramienta: todas las pruebas nuevas se ejecutaron y fallaron por la razón esperada (05 §2.2), salvo las de caracterización, que están en la regresión de su historia dueña (05 §2.4);
- [ ] las pruebas holdout existen cuando el track es T3 (o el perfil las exige);
- [ ] «Fuera de alcance» no está vacío;
- [ ] las tareas están escritas, con superficie de cambio y criterios que dejan en verde, sin inventar requisitos;
- [ ] cada tarea tiene su nota de diseño (10 §5), decidida a partir del catálogo de diseño y del resumen estructural;
- [ ] la historia tiene **3 tareas como máximo** (04 §3); si no, se dividió.

Si una casilla no aplica, se puede marcar `N/A` con justificación. No se debe forzar una historia a `Ready` por presión de planificación.

## 2. Definition of Ready — T1 (defecto, chore, lote de estabilización)

- [ ] el elemento está en el backlog, con severidad e historia de origen si es defecto;
- [ ] el criterio dice qué comportamiento es el correcto;
- [ ] la comprobación de reproducción existe (prueba protegida o comando de verificación) y falla contra la base por la razón esperada, o el elemento declara «sin RED» con motivo y aprobación;
- [ ] la superficie de cambio está publicada;
- [ ] el responsable humano aprobó el PR de especificación.

Para T0 basta con la tarea (§3).

## 3. Definition of Ready — Tarea

Una tarea puede pasar a ejecución cuando:

- [ ] pertenece a un elemento aprobado y en `Ready`;
- [ ] su rama nace de `dev` (o de `main`, si es un hotfix: 07 §9);
- [ ] tiene un resultado principal concreto;
- [ ] alcance, exclusiones y restricciones están claros;
- [ ] la superficie de cambio y la lista de criterios que deja en verde están publicadas en la rama protegida (la última tarea del elemento no necesita lista: ejecuta el elemento completo);
- [ ] si introduce un estado, lista las transiciones que lo crean y lo limpian;
- [ ] dependencias/contratos se conocen;
- [ ] permisos del agente están definidos;
- [ ] los comandos de validación exactos y las pruebas de regresión afectadas están listados;
- [ ] el presupuesto de diff está estimado por separado para producción y pruebas;
- [ ] la condición de finalización está definida;
- [ ] el contexto necesario está disponible.

## 4. Definition of Done — Tarea

Una tarea está técnicamente terminada cuando:

- [ ] cumple el resultado especificado;
- [ ] el baseline de pruebas se registró al inicio de la sesión;
- [ ] el cambio está dentro de la superficie de cambio;
- [ ] el diseño sigue la nota de diseño y no muestra síntomas del nivel 1 (10 §3);
- [ ] las pruebas pertinentes se añadieron/actualizaron y ejecutaron;
- [ ] lint, tipos y análisis requeridos pasan;
- [ ] los commits separan cambios estructurales y conductuales;
- [ ] el guardián de CI no reporta alertas, o cada alerta tiene justificación y aprobación de una persona autorizada;
- [ ] la CI ejecutó lo que debía (confirmado en el log: criterios, número de pruebas);
- [ ] se inspeccionó el diff y no hay cambios ajenos;
- [ ] no se introdujeron secretos, artefactos temporales ni dependencias no aprobadas;
- [ ] no quedan servidores, procesos ni datos del rol en el entorno (06 §10);
- [ ] se entregó el reporte con evidencia ejecutada y bloqueos conocidos;
- [ ] el verificador emitió `PASS` **antes de integrar**, y los hallazgos fuera de la tarea están registrados como defectos con severidad.

La tarea pasa a revisión; el programador no la marca como aceptada.

## 5. Definition of Done — Historia de Usuario o Enabler

Una historia puede pasar a `Ready for Acceptance` cuando:

- [ ] todas sus tareas están técnicamente terminadas e integradas;
- [ ] todos los criterios de aceptación tienen evidencia PASS o una excepción formal aprobada;
- [ ] pruebas unitarias, integración, contrato, E2E y regresión requeridas pasan;
- [ ] controles estáticos y de seguridad aplicables pasan;
- [ ] las pruebas holdout pasan, cuando existen;
- [ ] el verificador independiente re-ejecutó las validaciones y emite `PASS`;
- [ ] existe evidencia de la prueba manual agéntica cuando el track la exige (05 §11);
- [ ] no quedan defectos Críticos ni bloqueantes conocidos;
- [ ] cada hallazgo que no se corrigió está en el backlog como defecto, con severidad, historia de origen y criterio (02 §9);
- [ ] documentación/ADRs afectados y el catálogo de diseño (10 §6) están actualizados con lo que el plan técnico tenía de valor futuro, y el plan técnico se eliminó (03 §1.2);
- [ ] las vistas del backlog están regeneradas (02 §11);
- [ ] el comportamiento existente relevante no sufrió regresiones;
- [ ] el resultado puede probarse en un entorno apropiado.

Después de eso:

- funcionalidades visibles o relevantes para el usuario pasan por aceptación humana según el perfil; aceptada, la historia queda en `dev` hasta el release (07 §8);
- en T3, el responsable humano revisa el código de las zonas de riesgo (00 §8);
- el responsable humano emite `Accepted` o `Rejected`;
- solo entonces la historia se considera aceptada;
- el cierre añade la historia a la regresión de la rama principal, y la CI del cierre confirma que sus pruebas se ejecutaron y pasaron;
- en T2/T3, el orquestador ejecuta la retrospectiva compuesta (09 §3) y registra las métricas del elemento (09 §6);
- antes de pasar a la siguiente historia se evalúa la compuerta de estabilización: si está cerrada, lo siguiente es un lote de estabilización (02 §9.4).

Un resultado `BLOCKED`, `NOT RUN` o una prueba omitida sin justificación no equivale a `PASS`.

## 6. Definition of Done — Lote de estabilización

- [ ] cada defecto del lote tiene su comprobación en verde, ejecutada por la CI y por el verificador;
- [ ] los defectos que no se corrigieron siguen abiertos, con el motivo;
- [ ] las comprobaciones del lote están en la regresión de la rama principal;
- [ ] el responsable humano aceptó el lote;
- [ ] la compuerta de estabilización se volvió a evaluar.

## 7. Definition of Done — Hotfix

- [ ] cumple la DoD de un T1, con todas sus ramas nacidas de `main` e integradas en `main`;
- [ ] la ruta por hotfix es una decisión registrada en el defecto;
- [ ] el back-merge de `main` a `dev` está integrado, con merge commit y la regresión de `dev` en verde;
- [ ] el defecto está en `Released`.

## 8. Definition of Done — Release

- [ ] las notas del release están escritas (elementos, defectos conocidos, vuelta atrás);
- [ ] la compuerta de estabilización está abierta sobre `dev`;
- [ ] `main` está contenido en `dev`, comprobado por la CI;
- [ ] la regresión completa pasa en el PR de release;
- [ ] el responsable humano aprobó e integró el PR con merge commit;
- [ ] los elementos incluidos están en `Released` y la versión está marcada;
- [ ] el back-merge de `main` a `dev` está integrado.

## 9. Definition of Done del proyecto

El proyecto puede declararse listo para una liberación cuando se cumplen sus gates de release, seguridad, migración, documentación, recuperación y aprobación definidos en el perfil. No basta con que todas las historias estén en estado `Accepted` si aún existen riesgos de liberación sin resolver o defectos abiertos por encima de lo que el perfil permite liberar.
