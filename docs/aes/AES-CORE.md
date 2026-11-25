# Agentic Engineering Standard — AES Core 1.5.1

<!-- Archivo generado por scripts/build-core.sh a partir de standard/. No editar a mano. -->

# 00 — Gobierno y principios de AES Core

## 1. Propósito

AES define un proceso reproducible para producir software correcto, mantenible y verificable mediante personas y agentes de IA. El objetivo no es maximizar documentos ni velocidad de generación de código: es entregar comportamiento útil, dentro del alcance aprobado, con evidencia suficiente de calidad.

## 2. Principios obligatorios

1. **Valor antes que actividad.** El trabajo se organiza alrededor de resultados para usuarios o necesidades técnicas justificadas, no alrededor de cantidad de código o documentos.
2. **Planificación progresiva.** La visión y los límites arquitectónicos se establecen temprano; el detalle de implementación se agrega cuando el trabajo se aproxima y existe información suficiente.
3. **Una fuente de verdad.** Los requisitos aprobados, criterios de aceptación y decisiones vigentes deben tener una ubicación identificable. Los mensajes del chat no sustituyen los artefactos del proyecto.
4. **Alcance explícito.** Cada Historia de Usuario define lo incluido y, cuando sea relevante, lo excluido. Los agentes NO DEBEN ampliar el alcance por iniciativa propia.
5. **Tareas pequeñas y verificables.** Una tarea debe producir un resultado concreto, tener límites claros y poder comprobarse sin tener que aceptar una gran cantidad de trabajo no relacionado.
6. **Pruebas desde el requisito.** Los criterios de aceptación se definen antes de implementar. Las pruebas técnicas acompañan el desarrollo.
7. **Independencia de verificación.** El agente que implementa no puede aprobar su propio trabajo. La verificación se basa en artefactos y evidencias, no en el informe del implementador.
8. **Seguridad por permisos.** Las restricciones importantes se aplican técnicamente mediante Git, sistema operativo, contenedores, permisos, CI y protección de ramas; no solo mediante prompts. Un control solo cuenta como técnico si el agente no puede desactivarlo ni esquivarlo desde su propio entorno (ver 06 §9, modelo de capas L1/L2/L3).
9. **Simplicidad deliberada.** Se reutiliza lo existente y se evita añadir abstracciones, dependencias, capas o funcionalidades sin necesidad demostrable.
10. **Trazabilidad proporcional al riesgo.** Los cambios importantes deben poder rastrearse desde el requisito hasta la evidencia. No se exige burocracia para cambios triviales.
11. **Transparencia de incertidumbre.** Los agentes deben distinguir hechos comprobados, supuestos, riesgos y aspectos no verificados.
12. **Aprobación humana en decisiones reservadas.** Los agentes pueden recomendar; no pueden apropiarse de decisiones de producto, cambios materiales de alcance, riesgos críticos o aceptación humana.
13. **La prueba de aceptación es la especificación ejecutable.** La prosa explica la intención; la suite de aceptación protegida la hace exigible. Cuando una especificación en prosa y una prueba de aceptación aprobada discrepan, la discrepancia es un defecto de especificación que se resuelve por control de cambios. Ningún agente decide unilateralmente cuál de las dos prevalece.
14. **Evidencia ejecutada, no narrada.** Solo cuenta como evidencia la salida capturada por la CI o por una herramienta que ejecuta y registra el comando. El resumen escrito por un agente es contexto, no evidencia.
15. **Proceso proporcional.** El tamaño del proceso depende del track del cambio (02 §8). Un cambio trivial no recorre el ciclo de una historia de alto riesgo, y un cambio de alto riesgo no se trata como trivial.
16. **Mejora continua del harness.** Los fallos de los agentes se registran y se convierten en controles (09). El mismo error no debe depender de que alguien lo recuerde.
17. **Estabilidad antes que avance.** No se construye funcionalidad nueva sobre defectos conocidos. Los defectos se clasifican por severidad y se corrigen antes de empezar la siguiente historia, salvo los menores (02 §9). Corregir un defecto viejo mientras se construye algo nuevo mezcla dos cambios y produce defectos nuevos.
18. **Cada decisión tiene firma.** Toda ambigüedad que afecta el producto se resuelve con una decisión registrada: quién, cuándo, qué opciones había y qué cambió (03 §8). Lo que nadie decidió explícitamente no es una decisión, aunque una prueba o un agente ya lo haya fijado.
19. **Lo estable está separado de lo que se construye.** La rama principal solo contiene lo liberado; todo lo demás se integra antes en una rama de desarrollo (07 §7). Un arreglo de algo liberado sale de lo liberado, no de lo que está en construcción.
20. **Principios fijos, patrones con razón.** Los principios de diseño del nivel 1 se aplican siempre, en todo código; los patrones, solo con una razón presente, y decidir no usarlos vale tanto como decidir usarlos (10). Ninguno se pide con una instrucción genérica: se pide con reglas, síntomas y una nota de diseño concreta.
21. **Cortes verticales, historias atómicas, detalle a tiempo.** Cada historia es una sola capacidad del usuario, construida de punta a punta (datos, servidor, interfaz) y comprobable el mismo día; nunca una capa entera antes que la siguiente. El backlog se planifica completo pero superficial al inicio, y el detalle técnico de cada historia se decide cuando le toca (02 §3, §7).

## 3. Adaptabilidad

AES Core es común entre proyectos. Cada proyecto puede adaptar:

- lenguaje, framework, base de datos y proveedores;
- estructura de carpetas y herramientas de seguimiento;
- comandos de build, lint, análisis y pruebas;
- umbrales de cobertura y controles específicos del stack;
- modelos, harnesses, MCP, skills y herramientas disponibles.

El proyecto NO DEBE debilitar controles de seguridad, independencia de verificación, protección de pruebas de aceptación, trazabilidad de cambios relevantes ni aprobación de decisiones reservadas sin una excepción documentada.

## 4. Excepciones

Una excepción a una regla SHOULD/MUST debe registrar:

- regla afectada;
- motivo y contexto;
- riesgos introducidos;
- mitigación o control compensatorio;
- responsable que la aprobó;
- fecha o condición de expiración, si aplica.

Una excepción no debe presentarse como cumplimiento normal del estándar. Las excepciones a controles fundamentales MUST ser aprobadas por el responsable humano del proyecto.

## 5. Roles y autoridad

Los nombres pueden cambiar según las herramientas, pero las responsabilidades deben mantenerse:

- **Responsable del producto / humano:** define objetivos y prioridades; aprueba cambios materiales de alcance, decisiones reservadas y aceptación del producto.
- **Orquestador:** coordina el proceso, prepara contexto, delega trabajo, mantiene estados y hace cumplir gates. Es el diseñador senior: decide los patrones de cada tarea (10 §5), por lo que corre en el modelo más capaz disponible. No inventa requisitos ni se autoaprueba.
- **Arquitecto:** analiza estructura y consecuencias técnicas; propone decisiones y ADRs. El orquestador puede ocupar este rol.
- **Diseñador de pruebas / QA:** transforma criterios aprobados en escenarios y pruebas de aceptación; protege su integridad.
- **Programador:** implementa tareas delimitadas y sus pruebas técnicas permitidas.
- **Mecánico (opcional):** ejecuta cambios mecánicos y acotados (configuración no funcional, renombres, formato, consolidación de notas), sin lógica nueva. Permite asignar ese trabajo a un modelo más barato.
- **Verificador independiente:** comprueba el resultado contra requisitos y evidencia; no modifica el código bajo revisión.
- **CI y herramientas deterministas:** ejecutan controles repetibles. Sus resultados se conservan como evidencia.

Una persona o modelo puede asumir más de un rol en un proyecto pequeño, pero las funciones de implementación y aprobación/verificación deben permanecer separadas. Si se reutiliza el mismo modelo, la ejecución de verificación debe ser nueva, con contexto separado y permisos de solo lectura.

## 6. Estados de trabajo

Los proyectos DEBERÍAN usar, como mínimo, estados equivalentes a:

- `Draft`: todavía se está definiendo.
- `Ready`: cumple Definition of Ready.
- `In Progress`: implementación activa.
- `In Review`: esperando revisión o verificación.
- `Blocked`: depende de una decisión, recurso o corrección.
- `Ready for Acceptance`: gates técnicos superados; falta aceptación humana cuando aplique.
- `Accepted`: aceptado por la autoridad correspondiente e integrado en la rama de desarrollo (07 §7).
- `Released`: integrado en la rama principal mediante un release (07 §8) o un hotfix (07 §9).
- `Rejected`: no aceptado; requiere corrección o replanteamiento.
- `Deferred`: se pospone con motivo.

No se debe usar `Done` como sinónimo de «el agente terminó de escribir código».

## 7. Evidencia y afirmaciones

Un agente MUST NOT afirmar que una prueba pasó si no la ejecutó y no dispone del resultado. Si una prueba no se pudo ejecutar, se reporta como `NOT RUN` o `BLOCKED`, con el motivo. Los resultados deben incluir el comando o procedimiento, entorno relevante y salida resumida cuando sea posible.

Toda afirmación sobre el repositorio o el producto se comprueba **en su fuente**, no en un reflejo de ella:

- el contenido versionado, en lo que está versionado (`git show`, `git cat-file`), no en la copia de trabajo, que puede diferir (por ejemplo, en los fines de línea);
- el comportamiento implementado, en el código o ejecutándolo, no en las pruebas que lo describen ni en el reporte de quien lo implementó;
- lo que se ejecutó en la CI, en el log del run, no en el color del check.

La regla aplica a los agentes y también a los registros que escribe el humano o un asistente: un registro escrito de memoria es un supuesto hasta que se compruebe.

## 8. Revisión humana proporcional

AES no pretende que el responsable humano lea cada línea de código, pero tampoco permite que nadie revise nada. La revisión humana se desplaza **del código a los contratos**: si el humano no va a leer el código, DEBE leer y aprobar las pruebas de aceptación, porque son lo único en lo que el proceso confía sin intermediarios.

| Momento | Qué revisa el humano | T0 | T1 | T2 | T3 |
|---|---|---|---|---|---|
| Antes | Criterios de aceptación y exclusiones | — | ✓ | ✓ | ✓ |
| Antes | Pruebas de aceptación (escenarios y aserciones clave) | — | ✓ | ✓ | ✓ |
| Antes | Contrato de interfaz / ADR | — | — | si cambia | ✓ |
| Antes | Decisiones registradas y supuestos de QA resueltos (03 §8) | — | ✓ | ✓ | ✓ |
| Después, antes de integrar | Informe de verificación y evidencias (salidas, capturas) | — | ✓ | ✓ | ✓ |
| Después | Severidad de los defectos encontrados (02 §9) | si hay | si hay | si hay | si hay |
| Después | Alertas del guardián de CI (superficie, trampas) | si hay | si hay | si hay | ✓ |
| Después | Código | lectura rápida del diff | opcional | solo zonas señaladas | **zonas de riesgo, obligatorio** |
| Después | Demostración o prueba funcional propia | — | — | ✓ | ✓ |

En T3 no existe una forma responsable de omitir la revisión humana del código sensible (autenticación, autorización, datos, pagos, migraciones). El perfil del proyecto puede endurecer esta tabla, nunca relajarla sin excepción documentada.

---

# 01 — Inicio del proyecto y arquitectura

## 1. Objetivo

Establecer una comprensión compartida del producto y una arquitectura suficiente para guiar los incrementos sin diseñar prematuramente todos sus detalles.

## 2. Incepción: de la idea al backlog

Antes de escribir código, el responsable del producto y el orquestador **conversan en lenguaje natural** hasta que la idea es lo bastante clara para planificar. La incepción produce la visión, el backlog completo pero superficial, la arquitectura inicial y el stack. No produce criterios detallados, diseño de tareas ni código: eso llega cuando le toca a cada historia (02 §7).

La conduce el orquestador, en el modelo más capaz disponible (06 §11): de esta conversación salen el corte de las historias y las decisiones de arquitectura, que todo lo demás hereda.

### 2.1 La entrevista

El orquestador pregunta **por temas, en bloques cortos de preguntas concretas**:

| Tema | Qué tiene que quedar claro |
|---|---|
| Problema y usuarios | Quién usa el producto, qué hace hoy sin él y qué le duele |
| Lo que el usuario hace | Las acciones principales, de principio a fin (serán los Epics del mapa de historias) |
| Datos y reglas | Qué se guarda, qué reglas lo limitan, qué pasa en los casos raros |
| Restricciones | Privacidad, acceso, dispositivos, idioma, plazos, presupuesto, integraciones |
| Stack y operación | Preferencias o restricciones tecnológicas, dónde corre, quién lo mantiene |
| Primer release | Qué es lo mínimo que ya sirve, y qué puede esperar |
| Interfaz (si la hay) | Tono de los textos, accesibilidad, marca y recursos que ya existen, restricciones visuales que no se discuten |

Reglas de las preguntas:

- **Un bloque es un tema**, con 2 a 5 preguntas. No se mezclan temas, y no se manda la entrevista entera de una vez.
- **Cada pregunta es concreta y se responde en una o dos frases.** Cuando hay opciones razonables, el orquestador las propone con su recomendación, y el responsable elige o corrige. «¿Qué más necesitas?» o «¿Cómo te imaginas la app?» no son preguntas de AES: obligan al responsable a hacer el trabajo del orquestador.
- **Se pregunta por comportamiento, no por tecnología**, salvo en el bloque de stack. «¿Una tarea puede tener fecha límite?», no «¿Guardamos un `DateOnly` nullable?».
- **Cada bloque parte de las respuestas anteriores.** Antes del siguiente, el orquestador resume en tres o cuatro líneas lo que entendió, para que el responsable corrija a tiempo.
- **Lo que el responsable no sabe no se inventa:** queda «por definir» en el brief (supuesto o incertidumbre, con cómo se resolverá), o se convierte en un Spike (§7).

### 2.2 Cuándo parar

La entrevista termina cuando:

1. cada acción principal del usuario tiene historias con título en formato (02 §3), una línea de valor, `Requiere:` y una estimación aproximada;
2. el primer release está delimitado: qué historias entran y qué resultado observable da;
3. hay datos suficientes para elegir el stack y describir la arquitectura del esqueleto que camina;
4. lo que falta está nombrado como «por definir» o como Spike, con quién y cuándo lo resolverá.

No se sigue preguntando para completar el detalle de historias lejanas. Ese detalle se pregunta en el refinamiento de cada historia, cuando lo que enseñaron las anteriores ya está a la vista.

### 2.3 Lo que produce

1. **Project Brief:** problema, usuarios, objetivos, alcance, fuera de alcance, restricciones, supuestos e incertidumbres, riesgos, y los releases previstos.
2. **Backlog inicial, completo pero superficial** (02 §7, §11): todas las historias que se conocen para llegar al producto, agrupadas por Epic y asignadas a un release. Las historias pasan el control de atomicidad (02 §3.1) desde el principio: dividir en la incepción es barato, dividir a media implementación no.
3. **Architecture Overview** (§3) del esqueleto y las primeras historias, con un diagrama de componentes. El texto es la fuente; el diagrama es una vista y se regenera desde él.
4. **ADR del stack** (§4): opciones consideradas y por qué se elige una.
5. **Project Profile:** stack, entorno, comandos, convenciones, controles de calidad, agentes, permisos, skills y herramientas.
6. **Quality Strategy:** niveles de prueba, CI y controles aplicables.
7. **Dirección visual** (si hay interfaz): el sistema visual del producto (colores, tipografía, componentes, tono), elegido por el responsable humano entre opciones concretas, como el stack. El agente propone y el humano elige; el agente no la decide a partir de lo que le contestaron. EN-001 monta la interfaz ya con ella.
8. **EN-001, el esqueleto que camina** (02 §3.2), primero en el backlog: la aplicación arrancando de punta a punta, con la CI en verde, sobre la que crecen las historias.
9. **Copia local de las reglas que los agentes consultan:** como mínimo, las checklists de DoR y DoD (08) dentro del repositorio (por ejemplo, `docs/aes/`), con la versión de AES de la que salen. Un agente que solo tiene la referencia «AES 08» revisa la DoR de memoria.

### 2.4 Aprobación y revisión

Todo lo anterior entra en **un PR de incepción**, que aprueba el responsable humano. Hasta entonces, nada de lo producido es un compromiso; después, cambiarlo es normal y entra por PR como cualquier otro cambio del backlog.

Cuando aparece una idea nueva que no cabe en el backlog (un Epic nuevo, un cambio de usuario o de alcance), el orquestador hace una **mini-incepción**: solo los bloques afectados, con las mismas reglas, y un PR que actualiza el brief, el backlog y, si hace falta, la arquitectura. Una historia nueva dentro de un Epic existente no necesita mini-incepción: se añade al backlog.

### 2.5 Proyecto existente

Si se trabaja sobre un proyecto existente, primero se inspecciona el repositorio y el comportamiento actual, y la entrevista empieza por lo que el código no dice (para qué es, quién lo usa, qué falta). No se asume que la documentación está actualizada ni que la arquitectura deseada coincide con la implementada.

## 3. Contenido mínimo de arquitectura

El documento de arquitectura DEBERÍA cubrir, en proporción al proyecto:

- propósito, límites del sistema y actores externos;
- componentes/módulos y responsabilidades;
- dependencias y dirección de dependencias;
- stack tecnológico y versiones relevantes;
- persistencia, entidades principales y propiedad de los datos;
- autenticación, autorización y límites de confianza;
- integraciones y contratos externos;
- despliegue, configuración y observabilidad, si aplican;
- restricciones no funcionales relevantes: rendimiento, disponibilidad, privacidad, accesibilidad, mantenibilidad y seguridad.

No se exige definir clases, funciones, tablas o endpoints que todavía no se necesitan. El diseño detallado de una historia se realiza durante su refinamiento.

## 4. Decisiones de arquitectura (ADR)

Se DEBERÍA crear un ADR para decisiones con impacto material, difícil reversión o efecto transversal, por ejemplo:

- selección o sustitución de tecnología fundamental;
- límites entre módulos o servicios;
- estrategia de persistencia o migración de datos;
- autenticación/autorización;
- contratos de integración importantes;
- decisiones de escalabilidad, seguridad o despliegue;
- **convenciones que aplican a más de una historia**: cómo se valida, cómo se muestran los errores, qué control de UI se usa para cada tipo de dato, formato de fechas y montos. Si una convención se decide dentro de una historia y vale para las siguientes, sube a un ADR; si no, la siguiente historia vuelve a preguntarla, o la fija sin firma el primer agente que escribe una prueba.

Un ADR debe resumir contexto, decisión, alternativas consideradas, consecuencias, riesgos, estado y fecha. No se crean ADRs para elecciones locales triviales.

Los ADRs aceptados se consideran historial de decisiones. Si una decisión cambia, se crea un ADR que la sustituye; no se reescribe el pasado para ocultar el cambio.

## 5. Evolución arquitectónica

La arquitectura es evolutiva. Antes de implementar una historia, el arquitecto/orquestador DEBE identificar si el cambio:

- cabe dentro de los límites existentes;
- cambia un contrato o dependencia;
- introduce una tecnología o dependencia nueva;
- afecta seguridad, datos, rendimiento o despliegue;
- requiere una decisión humana.

Los cambios locales y reversibles pueden documentarse en la tarea o en el historial del cambio. Los cambios transversales requieren ADR y aprobación según el perfil del proyecto.

## 6. Regla contra la sobreingeniería

Un agente NO DEBE crear una abstracción, capa, servicio, microservicio, sistema genérico, framework interno, mecanismo de configuración o dependencia «por si acaso».

Antes de proponerlo, debe demostrar:

1. qué requisito actual lo necesita;
2. por qué la solución existente no basta;
3. qué alternativas más simples se consideraron;
4. qué coste de mantenimiento introduce.

La opción por defecto es la solución más simple que satisface los requisitos aprobados y mantiene los límites arquitectónicos.

## 7. Investigación y spikes

Cuando existe incertidumbre técnica material, se puede crear un `Spike` de investigación. Un Spike tiene pregunta, límite de tiempo/esfuerzo establecido por el proyecto, método de evaluación y resultado esperado (decisión, prototipo desechable o evidencia). No se debe convertir automáticamente un Spike en implementación de producción.

---

# 02 — Backlog y estimación

## 1. Jerarquía

AES utiliza esta jerarquía lógica:

`Product Goal / Vision → Epic → User Story → Task/Subtask → Test/Evidence`

Los defectos (`Bug`), tareas técnicas (`Enabler`), tareas de mantenimiento (`Chore`), lotes de estabilización (§9.4) y actividades de investigación (`Spike`) pueden aparecer como tipos de elemento relacionados con el backlog. No deben disfrazarse de historias de usuario si no representan valor de usuario.

Los defectos, chores y hallazgos que se dejan para después son **elementos de primera clase** del backlog: tienen ID, criterio, track y, si son defectos, severidad. Una nota en un documento o en un comentario de PR no es un elemento del backlog y se pierde.

## 2. Product Goal y Epics

- El **Product Goal** expresa el resultado general buscado.
- Un **Epic** agrupa una capacidad amplia que debe descomponerse en historias entregables.
- Un Epic puede tener hipótesis, riesgos, métricas y dependencias, pero no necesita tareas detalladas desde el inicio.

## 3. Historias de Usuario

Una Historia de Usuario representa una necesidad/comportamiento con valor identificable para un usuario o actor. Su **título** MUST tener este formato:

> Como [tipo de usuario], quiero [capacidad], para [beneficio].

> Como usuario, quiero registrar un pago pendiente, para no olvidarme de él.

Otros elementos tienen su propio formato, porque no tienen un usuario que los pida:

| Tipo | Formato del título | Ejemplo |
|---|---|---|
| Enabler | Para [historia u objetivo], necesitamos [capacidad técnica] | Para que las historias de pagos se puedan probar de punta a punta, necesitamos la app arrancando con base de datos, API y web |
| Defecto | [Comportamiento incorrecto, en una frase] | Un monto «abc» dice «obligatorio» en lugar de «inválido» |
| Chore | [Cambio de mantenimiento] para [motivo] | Fijar las fuentes de paquetes para que la restauración no dependa de la máquina |

Cada historia incluye criterios de aceptación verificables y límites de alcance, y declara con `Requiere:` los elementos que deben estar terminados antes (por ejemplo, `Requiere: US-001`).

### 3.1 Historias atómicas

Una historia MUST ser **atómica**: una sola capacidad del usuario que se puede demostrar por sí sola, y que no contiene otra capacidad que también se podría demostrar sola. No se mide por verbos: «crear tareas y verlas en mi lista» es una capacidad, porque crear sin ver no se puede comprobar; «registrarme y crear tareas» son dos.

- Un «y» que une dos objetivos del usuario en el «quiero» es la señal de que hay que dividirla.
- Las épicas y las funcionalidades grandes existen, pero solo como agrupación: se implementan como historias atómicas, nunca de una sola vez.
- Motivo: una historia atómica se puede verificar, auditar, medir y depurar. Una historia que implica muchas funcionalidades a la vez es más difícil de depurar, hace que el agente pierda el control del contexto y alucine, y retrasa el momento de comprobar que lo construido sirve.

Una historia puede ser atómica para el usuario y aun así grande por dentro. Dos señales objetivas obligan a dividirla:

1. **Al estimar:** 8 puntos o más (§5).
2. **Al diseñar:** si el orquestador no consigue dividirla en **3 tareas como máximo**, cada una dentro del presupuesto de diff de producción y dejando criterios en verde (04 §3). No se hacen tareas más grandes: se divide la historia (§10).

### 3.2 Cortes verticales

Cada historia es un **corte vertical completo**: la parte mínima de cada capa (datos, servidor, interfaz) para que la capacidad funcione de verdad y se pueda usar. No se construye una capa entera antes que la siguiente: «toda la base de datos, después todo el servidor, después toda la interfaz» tarda semanas en mostrar que algo no servía, y un corte vertical lo muestra el mismo día.

- El esquema de datos crece historia a historia: cada historia trae la migración que necesita, y nada más.
- El primer elemento del proyecto es un **esqueleto que camina** (*walking skeleton*): un enabler que deja la aplicación arrancando de punta a punta con un caso trivial (por ejemplo, una página que muestra el estado de la API, que a su vez lee la base de datos), con la CI ya en verde. Las historias siguientes engrosan ese esqueleto.
- Dentro de una historia vale lo mismo: primero el camino más delgado de punta a punta, después las reglas y los casos límite.

## 4. Priorización

La prioridad y la estimación son dimensiones distintas. Cada proyecto DEBERÍA declarar una escala sencilla, por ejemplo `P0` crítica, `P1` alta, `P2` normal y `P3` baja. La prioridad representa orden/valor, no esfuerzo.

La priorización considera valor, urgencia, riesgo, dependencias y coste de demora cuando sean relevantes. Los agentes pueden recomendar prioridades, pero el responsable del producto aprueba cambios significativos.

## 5. Estimación de Historias de Usuario

AES adopta Story Points relativos usando la secuencia Fibonacci:

`1, 2, 3, 5, 8, 13`

Los puntos expresan una combinación relativa de esfuerzo, complejidad e incertidumbre comparada con otras historias del mismo proyecto. NO representan horas, días, productividad individual ni una promesa de fecha.

Guía orientativa:

- **1:** cambio muy pequeño, conocido y de bajo riesgo.
- **2:** pequeño, con pocas dependencias y comportamiento claro.
- **3:** complejidad moderada, alcance conocido.
- **5:** varias partes o escenarios, pero entendidos.
- **8:** demasiado grande para una historia atómica: MUST dividirse antes de refinarse (§3.1, §10).
- **13:** demasiado grande o incierto para planificar con confianza: se divide o se investiga con un Spike.

Una historia de 8 o más no pasa a refinamiento: se divide en historias con valor verificable, o se crea un Spike cuando la incertidumbre impide dividirla de forma responsable.

La estimación debe basarse en el alcance aprobado y en referencias históricas del proyecto. No se debe usar para comparar personas, modelos o equipos.

## 6. Tamaño de tareas

Las tareas no necesitan Story Points obligatoriamente. Deben ser pequeñas, observables y verificables. Su tamaño se determina por la claridad del resultado, superficie de cambio, dependencias y facilidad de prueba, no por una duración ficticiamente precisa.

Una tarea SHOULD:

- producir un resultado principal identificable;
- tener un alcance y límites concretos;
- poder implementarse y depurarse sin coordinar muchos cambios independientes;
- tener una forma clara de validación;
- evitar mezclar responsabilidades diferentes;
- ser suficientemente pequeña para entender qué falló si su prueba falla.

Una tarea MUST dividirse si contiene varios resultados independientes, combina responsabilidades no relacionadas, abarca demasiados componentes sin razón, tiene dependencias ocultas o no puede verificarse de forma focalizada.

No se fija un límite universal en horas. Si una tarea parece grande, se divide por resultado verificable, no arbitrariamente en fragmentos que no tienen sentido por sí solos.

Heurísticas específicas para tareas ejecutadas por agentes (el perfil las ajusta):

- la tarea SHOULD poder completarse en **una sola sesión con contexto nuevo**, sin compactación;
- el diff resultante SHOULD ser revisable de una vez; el perfil fija un **presupuesto de diff orientativo** (por ejemplo, 300–400 líneas cambiadas). Superarlo no es un fallo automático, pero obliga a justificar por qué no se dividió;
- el presupuesto se estima **por separado para código de producción y para pruebas**. El desvío que exige justificación es el de producción: un único número castiga probar bien (en el sandbox de AES, el 60 % de una tarea de 474 líneas eran pruebas unitarias);
- la tarea SHOULD tocar una única superficie de cambio coherente (04 §2).

## 7. Refinamiento continuo: planificación en dos niveles

La planificación tiene dos niveles, y el detalle llega tarde a propósito:

1. **Al inicio del proyecto** (ligero, en la incepción, 01 §2): visión del producto, stack, y un **backlog completo pero superficial**: todas las historias que se conocen para llegar a la app completa, cada una con su título en formato, una línea de valor, `Requiere:`, una estimación aproximada y el release al que apunta. Nada de criterios detallados, diseño ni tareas.
2. **Cuando le toca a cada historia** (detallado): criterios, decisiones, fuera de alcance, plan técnico y tareas. Solo entonces, porque es cuando se sabe lo que las historias anteriores enseñaron.

El backlog inicial va a cambiar: reordenar, dividir, fusionar o descartar historias es parte del proceso, no un fallo de la planificación. Solo las historias próximas necesitan cumplir completamente la DoR.

No se debe congelar un plan detallado de meses de trabajo si las historias posteriores dependen de descubrimientos aún no realizados.

## 8. Tracks proporcionales

AES no aplica el mismo proceso a todos los cambios. Una crítica conocida a las herramientas de spec-driven development es que convierten cambios pequeños en una cascada de documentos. AES evita ese coste clasificando cada elemento de trabajo en un **track** que fija los artefactos y gates mínimos.

| Track | Cuándo | Artefactos mínimos | Gate humano previo |
|---|---|---|---|
| **T0 — Trivial** | Errata, texto, configuración no funcional, actualización de parche sin cambio de API | Tarea + CI verde | Ninguno |
| **T1 — Bug / chore** | Comportamiento existente incorrecto, o cambio pequeño con un criterio verificable (configuración funcional, herramienta, script) | Elemento con severidad (si es defecto) y criterio + comprobación de reproducción **protegida** que falla (RED): prueba de aceptación o comando de verificación (05 §12) + tarea. Camino corto en 04 §10 | Aprobar que la comprobación describe el comportamiento correcto |
| **T2 — Historia** | Comportamiento nuevo de alcance conocido | Historia, criterios, contrato de interfaz (si hay frontera nueva), suite de aceptación con RED confirmado, tareas | Aprobar criterios y pruebas de aceptación |
| **T3 — Alto riesgo** | Autenticación, autorización, datos sensibles, pagos, migraciones, cambio arquitectónico o de contrato público | Todo T2 + ADR + pruebas holdout obligatorias + Spike si hay incertidumbre | Criterios, pruebas, ADR; revisión humana del código de riesgo después |

Reglas:

- El orquestador propone el track; el responsable humano puede cambiarlo.
- **Subir** de track durante el trabajo es automático en cuanto aparece un riesgo nuevo. **Bajar** de track requiere justificación registrada.
- Un T1 siempre empieza con una comprobación que reproduce el defecto (o la ausencia del cambio) y falla antes del arreglo. Si no existe ninguna comprobación que falle antes (por ejemplo, una configuración que ya funciona por casualidad en el entorno), el elemento lo declara como «sin RED», con el motivo, y el responsable humano lo aprueba de forma explícita.
- Los defectos encontrados durante la verificación o la prueba manual agéntica (05 §11) que no pertenecen a lo que añade la tarea se registran como T1, con severidad (§9).
- Los niveles de riesgo de 07 §2 se corresponden así: `Low` → T0/T1/T2 según el tipo; `Medium` → T2; `High`/`Critical` → T3.

## 9. Defectos: severidad y compuerta de estabilización

### 9.1 Severidad

La severidad mide el daño del defecto; la prioridad (§4), el orden en que se trabaja. Son independientes. Todo defecto registrado lleva una severidad:

| Severidad | Cuándo | Ejemplos |
|---|---|---|
| **Crítica** | Pérdida o corrupción de datos, fallo de seguridad, la aplicación no arranca, el flujo principal es inutilizable, o la CI de `dev` o de `main` está en rojo | Un gasto guardado se pierde; un usuario ve datos de otro; `main` no compila |
| **Alta** | Un criterio de aceptación ya aceptado deja de cumplirse, o un flujo importante falla sin alternativa razonable. Una **prueba inestable** en la suite que corre en la rama principal es Alta: puede poner en rojo a todos | Editar un gasto no guarda; una prueba de regresión falla 1 de cada 3 corridas |
| **Media** | Comportamiento incorrecto con alternativa, o en un flujo secundario; un mensaje o una respuesta de error que lleva al usuario a una conclusión equivocada | Un monto `abc` dice «obligatorio» en lugar de «inválido»; un cuerpo mal codificado responde `500` en lugar de `400` |
| **Menor** | Cosmético o de presentación, sin efecto en los datos ni en las decisiones del usuario | Un separador de miles distinto; dos paneles abiertos a la vez sin consecuencia |

El orquestador propone la severidad con la evidencia del hallazgo; el responsable humano la confirma o la cambia. Bajar la severidad de un defecto ya registrado es una decisión registrada (03 §8), con motivo.

### 9.2 Compuerta de estabilización

Una historia o enabler nuevo (T2/T3) **no puede pasar a `Ready`** mientras exista en el backlog algún defecto abierto de severidad **Crítica, Alta o Media**, ni mientras el número de defectos **Menores** abiertos supere el límite del perfil (por defecto, 5).

- Un defecto **Crítico** detiene además todo el trabajo en curso, incluida la historia activa: no se integra ningún cambio de código en `dev` ni en `main` salvo su corrección. Excepción: si el defecto es de la propia tarea en curso, se trata como ciclo `FAIL` de esa tarea (04 §9).
- Un defecto **Alto o Medio** encontrado durante una historia no la detiene: la historia termina, y la siguiente no empieza hasta corregirlo.
- Los defectos **Menores** pueden quedar abiertos dentro del límite. Cuando se supera, se corrigen en lote antes de seguir.
- Un defecto «abierto» es cualquiera que no está `Accepted` (corregido y aceptado) ni `Rejected` (no era un defecto). `Deferred` cuenta como abierto: posponer un defecto no lo corrige.
- Las únicas formas de abrir la compuerta son corregir los defectos o una excepción documentada (00 §4). Absorber un defecto dentro de la historia siguiente es una excepción, no un camino normal: mezcla la corrección de lo viejo con la construcción de lo nuevo.

La misma compuerta se evalúa al **liberar** (07 §8): un release no sale con defectos Críticos, Altos o Medios abiertos, ni con más Menores que el límite. Un defecto de algo ya liberado puede corregirse por hotfix o por `dev`, a elección del responsable humano (07 §9).

El perfil puede endurecer la compuerta (por ejemplo, un límite menor de defectos menores), nunca relajarla sin excepción documentada. La compuerta SHOULD implementarse en la CI (L3), leyendo el backlog desde la rama protegida; la implementación de referencia lo hace.

### 9.3 Qué es un defecto y qué no

- Un `FAIL` del verificador, o un check rojo de la CI, es un ciclo `FAIL` de la tarea (04 §9).
- Tras un `PASS`, cada hallazgo trae **origen** (de la tarea o preexistente) y **tipo** (defecto: incumple algo escrito; hueco de la especificación: nada escrito lo decide). La regla por defecto:

  | Hallazgo tras un PASS | Qué se hace |
  |---|---|
  | De la tarea, defecto, severidad **Media o mayor** | Ciclo `FAIL` de la tarea, antes de integrar |
  | De la tarea, defecto **Menor** | Defecto del backlog (`BUG-NNN`, de la historia en curso). El humano puede pedir corregirlo ahora como ciclo `FAIL` |
  | De la tarea, **hueco de la especificación** | No es un ciclo. Se corrige la especificación: la nota en el cierre y el catálogo de diseño. Si el comportamiento debe cambiar, es un defecto Menor del backlog o un criterio de una historia posterior |
  | Preexistente | Defecto del backlog con severidad |

- Un hallazgo Menor que aparece **en una reverificación**, fuera de lo que cambió el último ciclo, va al backlog: no abre otro ciclo. Así una tarea no gasta sus 3 ciclos puliendo detalles mientras la compuerta de estabilización (§9.2) ya limita cuántos Menores se acumulan.
- Un hallazgo sobre comportamiento **ya aceptado o preexistente** es un defecto: se registra con ID, severidad, historia de origen, reproducción y criterio, aunque se encuentre durante otra historia.
- El responsable humano puede reemplazar esta regla en el perfil por una **regla permanente** propia. El orquestador la aplica, registra cada clasificación como decisión y se la muestra al humano, que puede cambiarla antes de integrar.

### 9.4 Lote de estabilización

Los defectos que cierran la compuerta se corrigen juntos en un **lote de estabilización**: un elemento del backlog (por ejemplo, `ST-NNN`) que agrupa los defectos de una historia y los asociados a ella.

- Un lote se trabaja en **una sola sesión** del orquestador, sin mezclar funcionalidad nueva.
- Sigue el camino T1 (04 §10): un PR de especificación con los defectos, su severidad y su criterio; las comprobaciones de reproducción con RED; tareas agrupadas por superficie de cambio; verificación; cierre.
- Las comprobaciones de reproducción del lote pasan a la regresión al cerrarlo, como las de una historia.
- Un defecto que el lote no logra corregir sigue abierto y la compuerta sigue cerrada.

## 10. Cómo dividir una historia

Formas de dividir una historia grande, de la más habitual a la menos. Cada parte resultante sigue siendo atómica, vertical y con valor propio.

| Forma | Cuándo | Ejemplo |
|---|---|---|
| **Camino feliz primero, reglas después** | La historia tiene validaciones, errores y casos límite | «Registrarme con email y contraseña y entrar con la sesión iniciada» primero; «ver un aviso si el email ya existe» después |
| **Por variación de datos o de reglas** | La misma capacidad aplica a varios tipos, monedas, canales o roles | Un tipo de pago ahora, los demás después |
| **Por pasos del flujo** | El usuario completa etapas por separado | «Agregar un pago» y «marcar un pago como hecho» |
| **Por operación** | Crear, ver, editar y eliminar pueden demostrarse por separado | «Registrar un gasto» y «editar un gasto» |
| **Lo no funcional después** | Rendimiento, caché, paginación, exportación | «Ver mis pagos» primero; «ver mis pagos paginados» cuando sean muchos |
| **Spike** | Lo grande es la incertidumbre, no el trabajo | Averiguar cómo autenticar contra un proveedor antes de planificar el inicio de sesión |
| **Enabler** | Una pieza técnica es inevitable y la necesitan varias historias | La infraestructura de autenticación, con un criterio verificable propio (un comando o un caso mínimo de punta a punta), nunca «toda la base de datos» |

Una historia dividida conserva su orden con `Requiere:`. Si ninguna forma la deja en 3 tareas o menos, el problema suele ser de diseño o de incertidumbre: se pregunta al responsable humano o se abre un Spike.

## 11. El backlog como archivo y sus vistas

El backlog vive en **un archivo del repositorio** (por ejemplo, `docs/backlog.md`), que es la única fuente de verdad. No depende de ningún servicio, viaja con el código y pasa por PR, así que cada cambio lleva la firma del responsable humano. La CI lo lee (la compuerta de estabilización, 02 §9) y los agentes lo leen sin herramientas externas.

El formato MUST ser una tabla con estas columnas, en cualquier orden:

| Columna | Contenido |
|---|---|
| `ID` | `US-NNN`, `EN-NNN`, `BUG-NNN`, `CH-NNN`, `ST-NNN`, `SP-NNN`, `REL-NNN` |
| `Tipo` | Historia, Enabler, Defecto, Chore, Lote, Spike, Release |
| `Título` | En el formato de su tipo (§3) |
| `Requiere` | IDs separados por coma, o `—` |
| `Puntos` | Fibonacci (§5), o `—` |
| `Prioridad` | Escala del perfil (§4) |
| `Severidad` | Solo defectos (§9.1); el resto, `—` |
| `Estado` | 00 §6 |

Dos columnas son opcionales y SHOULD usarse desde la incepción: `Epic`, la acción del usuario a la que pertenece la historia (§2), y `Release` (por ejemplo, `REL-001`), el release al que apunta (§12). Con ellas, el backlog es también el mapa de historias: Epics en una dimensión, releases en la otra.

Para el responsable humano, una tabla en un archivo no es la mejor forma de ver dónde va el proyecto. Las **vistas** (un tablero) se generan desde el archivo, en una sola dirección:

- la implementación de referencia genera un tablero HTML autocontenido, sin ningún servicio;
- adaptadores opcionales publican el mismo backlog en GitHub Projects, Trello, GitLab u otro tablero. Cambiar de herramienta es cambiar de adaptador, no de metodología;
- lo que se mueve en una vista no vuelve solo al archivo: se le pide al orquestador y entra por PR.

## 12. Releases como horizonte de planificación

AES planifica por **releases**, no por sprints. Un release es un conjunto de historias que, juntas, dan un resultado que el usuario puede usar, y se libera cuando está completo y la compuerta de estabilización lo permite (§9.2, 07 §8). No hay una duración fija: con agentes, el ritmo lo marcan la aprobación humana y la CI, no el calendario.

- **La incepción define los releases** (01 §2): el primero es lo mínimo que ya sirve; los siguientes, lo que se sabe que viene después. Cada uno tiene un objetivo de una frase y una lista de historias.
- **Solo el release en curso está comprometido.** Los siguientes son una previsión: se reordenan con lo que enseñe el primero.
- **Mover una historia de release** es un cambio del backlog y entra por PR. Si el release en curso crece, lo normal es mover historias al siguiente, no esperar.
- Los puntos aceptados por release (§5) sirven para prever los siguientes. No son una meta ni se comparan entre proyectos.


---

# 03 — Historias de Usuario y aceptación

## 1. Dos documentos: la historia y el plan técnico

Cada historia refinada tiene **dos** documentos, escritos para lectores distintos:

| Documento | Para quién | Lenguaje | Vida |
|---|---|---|---|
| **La historia** (`US-NNN.md`) | El responsable humano, y cualquiera que quiera saber qué hace el producto | De cliente, no de programador: qué se logra y cómo se comprueba, sin tablas, clases, endpoints ni patrones | Permanente |
| **El plan técnico** | Los agentes: orquestador, QA, programador, verificador | Técnico: contrato de interfaz, nota de diseño, tareas, superficies | Se elimina en el cierre, después de consolidar lo que tenga valor futuro (§1.2) |

Al responsable humano le interesa qué hace la historia, qué queda fuera, cómo se sabe que funciona y que funcione; no cómo se llaman los métodos ni qué patrón se usó. Mezclar los dos lectores en un documento hace que el humano firme detalles que no le corresponden y que los agentes tomen el lenguaje de negocio como especificación técnica.

### 1.1 Contenido de la historia

- título en el formato de su tipo (02 §3) y `Requiere:`;
- contexto y reglas relevantes, en términos del negocio;
- criterios de aceptación en lenguaje de cliente (§2);
- fuera de alcance (§4);
- **plan**: cómo se va a construir, contado como a un cliente (qué verá el usuario primero, qué viene después, qué se deja para otra historia);
- **sugerencias** del orquestador: qué considera el mejor camino y por qué, y qué alternativas descartó, también en lenguaje de cliente;
- prioridad, Story Points y track (02 §8); riesgos relevantes;
- estado y responsable de decisión;
- registro de decisiones (§8).

Un buen criterio de esta parte se lee así: «Dado que soy un visitante, cuando me registro con un email válido y una contraseña de al menos 8 caracteres, entonces mi cuenta queda creada y entro a la app con la sesión iniciada». No así: «Crear la tabla `usuarios`, un endpoint `POST /auth` y emitir un JWT».

### 1.2 Contenido del plan técnico

- contrato de interfaz contra el que se escriben las pruebas de aceptación, cuando la historia toca una frontera observable (05 §2.1);
- nota de diseño de cada tarea (10 §5);
- tareas, con su superficie de cambio y los criterios que dejan en verde (04 §2);
- plan de pruebas de aceptación (05).

En el **cierre** del elemento, antes de eliminar el plan técnico, lo que tenga valor para historias futuras pasa a donde se conserva: patrones y decisiones de no usar algo, al catálogo de diseño (10 §6); convenciones que valen para varias historias, a un ADR (01 §4). Lo demás se elimina: queda en el historial del control de versiones si alguna vez hace falta. Las pruebas de aceptación y los comandos de verificación **no** son parte del plan: son la regresión y se conservan.

No se deben rellenar campos con texto vacío. Un elemento puede permanecer en `Draft` hasta que exista información suficiente.

## 2. Criterios de aceptación

Los criterios deben expresar resultados observables, no detalles internos innecesarios. Deben ser:

- claros y no contradictorios;
- comprobables mediante una acción, resultado o inspección;
- vinculados al objetivo y al alcance;
- específicos sobre permisos, errores y límites cuando sean relevantes;
- independientes de una implementación concreta salvo que exista una restricción técnica aprobada.

En la historia, los criterios se escriben en lenguaje natural estructurado (Dado / Cuando / Entonces) y en términos del usuario. El detalle observable que necesitan las pruebas (selectores, rutas, códigos de respuesta) va en el contrato de interfaz del plan técnico, no en el criterio.

## 3. Casos negativos y límites

Cuando aplique, los criterios DEBERÍAN contemplar:

- entradas inválidas o incompletas;
- ausencia de datos;
- duplicados y conflictos;
- usuarios sin permisos;
- errores de servicios externos;
- **fallo de cada acción que escribe** (guardar, editar, eliminar, enviar): qué ve el usuario si la respuesta no es exitosa y si la red falla, y qué transiciones limpian ese estado de error;
- estados límite y concurrencia;
- compatibilidad con comportamiento existente;
- accesibilidad, privacidad y seguridad.

No todos los escenarios aplican a todas las historias. QA debe explicar brevemente por qué un escenario de riesgo relevante se omite.

El fallo de una acción que escribe MUST tener criterio en toda historia con interfaz de usuario. En el sandbox de AES, los dos ciclos `FAIL` de una historia vinieron del mismo hueco: ningún criterio decía qué pasaba al fallar el guardado o el borrado, y al añadir el mensaje de error nadie listó qué lo limpiaba.

## 4. Fuera de alcance

Las exclusiones son obligatorias cuando existe riesgo razonable de expansión del alcance. Deben nombrar funcionalidades cercanas que el agente podría implementar «por conveniencia» pero que no están aprobadas.

En T2 y T3 la sección «Fuera de alcance» MUST NOT estar vacía. Implementar funcionalidad no pedida, aunque parezca el siguiente paso razonable, es una de las señales de desvío más frecuentes en agentes; nombrar explícitamente lo excluido es la forma más barata de prevenirla.

## 5. Ambigüedad y supuestos

Los agentes no deben inventar comportamiento del producto. Deben:

- pedir decisión humana ante ambigüedades que afectan comportamiento visible, datos, seguridad, costes, integraciones, cumplimiento o decisiones irreversibles;
- registrar como supuesto una decisión de bajo riesgo, reversible y coherente con patrones existentes;
- elegir la alternativa más simple y consistente cuando el detalle es local y no cambia el contrato del producto;
- informar el supuesto en el reporte de ejecución.

Los **supuestos de QA** merecen una regla propia. Al escribir las pruebas, QA tiene que fijar detalles que el contrato no dice (el tipo de control de un campo, un formato, qué pasa en un caso límite). Si esos supuestos llegan a la suite sin decisión, QA define el producto y nadie lo firmó. Por eso:

- QA MUST listar en el plan de pruebas todo lo que tuvo que suponer;
- cada supuesto se convierte en contrato (decisión registrada, §8) o se rechaza **antes** de que la historia pase a `Ready`;
- ningún supuesto abierto pasa la DoR.

No se debe interrumpir al usuario por decisiones internas triviales que el estándar ya delega al equipo técnico.

## 6. Trazabilidad

Cada criterio de aceptación debe relacionarse con uno o más escenarios/pruebas o con una justificación explícita de verificación manual. Cada tarea debe referenciar la historia y los criterios que contribuye a satisfacer.

La trazabilidad SHOULD ser comprobable por máquina:

- cada prueba de aceptación lleva el ID de su historia y el de su criterio (por ejemplo, las etiquetas `@US-002` y `@US-002-AC-03`, y `AC-03` al inicio del título);
- cada tarea declara los criterios que deja en verde (04 §2), de modo que la CI ejecute solo esos (05 §12);
- toda prueba se deriva de un criterio aprobado. Si QA ve un hueco, propone un criterio nuevo; no escribe una prueba sin criterio.

Un criterio que describe un comportamiento que el código **ya tiene** no puede demostrar RED. Su verificación es la **regresión** de la historia dueña de ese comportamiento (05 §2.4), y el criterio lo dice: «Verificación: regresión de US-001».

No se considera trazabilidad suficiente una lista de pruebas sin vínculo con los requisitos.

## 7. Cambios en la historia

Una vez que la historia está `Ready`, los cambios de alcance, comportamiento esperado o criterios de aceptación requieren control de cambios. Las correcciones editoriales que no cambian el significado pueden hacerse sin re-aprobación, dejando historial cuando la herramienta lo permita.

## 8. Registro de decisiones

Cada historia tiene una sección «Decisiones». Cada ambigüedad resuelta y cada supuesto convertido en contrato es una fila:

| ID | Pregunta | Opciones | Decisión | Quién y fecha | Impacto |
|---|---|---|---|---|---|
| D-01 | ¿Qué categoría queda seleccionada al cancelar una edición? | Vuelve a la inicial / queda la última | Vuelve a la inicial | Responsable humano, 2026-11-05 | AC-12 modificado |

Reglas:

- La decisión entra en la historia **en el mismo PR** que la usa (refinamiento o pruebas). Aprobar ese PR es la firma del responsable humano.
- En «Impacto» va qué cambió: un criterio nuevo o modificado, el contrato de interfaz, un ADR, o «ninguno».
- Una decisión que vale para más de una historia sube a un ADR (01 §4).
- Una decisión que resultó basarse en un hecho falso se corrige **en su fila**, con fecha y motivo; no se borra.
- Las decisiones que el orquestador toma aplicando una regla permanente del humano (02 §9.3) también se registran, con la regla citada.

---

# 04 — Diseño y ejecución de tareas

## 1. Objetivo de una tarea

Una tarea transforma una parte de una Historia de Usuario o un enabler aprobado en un cambio concreto y comprobable. No es una instrucción abierta como «termina el módulo» o «mejora el código».

## 2. Campos obligatorios

Cada tarea lista para ejecución DEBE especificar:

- ID y título orientado al resultado;
- Historia de Usuario/Enabler relacionado;
- objetivo y resultado esperado;
- alcance incluido y exclusiones relevantes;
- dependencias y contratos que debe respetar;
- track (02 §8);
- **superficie de cambio**: globs de archivos que la tarea puede modificar;
- restricciones y permisos;
- **comandos de validación exactos** (no descripciones como «ejecuta las pruebas relevantes»);
- **pruebas de regresión afectadas** (test map), cuando puedan generarse o deducirse;
- **criterios que deja en verde**: los IDs de criterio (o de defecto) que esta tarea cumple. La CI de la tarea ejecuta solo esos más la regresión; la **última** tarea de la historia ejecuta la historia completa (05 §12);
- presupuesto de diff orientativo, separado en producción y pruebas (02 §6);
- **nota de diseño** (10 §5) en T2/T3: piezas, responsabilidades, patrón (o ausencia de patrón) y lo que no se hace;
- si la tarea introduce un **estado** (de error, de carga, de edición), las transiciones que lo crean y las que lo limpian;
- condición de finalización.

La superficie de cambio no es una sugerencia: la CI compara el diff contra ella (05 §10). Un archivo modificado fuera de la superficie es un `FAIL` salvo aprobación registrada. La superficie se publica en la rama protegida **antes** de delegar la tarea, para que el programador no pueda ampliarla.

### Por qué comandos exactos y no instrucciones de proceso

El estudio TDAD (Alonso, Yovine y Braberman, arXiv:2603.17973; tesis de maestría, Universidad ORT Uruguay) midió que añadir instrucciones genéricas de TDD a la guía de un agente aumentó su tasa de regresiones de 6,08 % a 9,94 %, mientras que darle un mapa de qué pruebas afecta cada archivo la redujo a 1,82 %. El estudio se hizo con un modelo abierto (Qwen3-Coder 30B) y solo en Python, así que AES no adopta la cifra, sino el principio: **información estructural concreta en lugar de procedimientos genéricos**.

## 3. Tamaño y divisibilidad

Una tarea es suficientemente pequeña si un agente puede comprender su objetivo, implementarla, inspeccionar el diff y ejecutar su validación sin tener que aceptar varios resultados independientes como un bloque indivisible.

Una historia tiene **3 tareas como máximo**. Si no cabe, la historia es demasiado grande y se divide (02 §3.1, §10), en lugar de hacer tareas más grandes.

Las tareas se dividen **por criterios** (cortes verticales que dejan criterios en verde), no por capas técnicas. Una tarea «solo API» y otra «solo UI» no pueden quedar verdes por separado si la aceptación cruza ambas. Sin CI por criterio, toda historia termina en una sola tarea grande: en el sandbox de AES, las dos primeras historias acabaron en tareas únicas de 300 a 500 líneas.

Señales para dividir:

- más de un resultado observable sin dependencia necesaria;
- lógica, interfaz, migración y despliegue agrupados solo por conveniencia;
- múltiples módulos o contratos modificados sin una razón común;
- numerosas condiciones de aceptación que pueden fallar de forma independiente;
- alta incertidumbre técnica;
- imposibilidad de describir una prueba focalizada.

No dividir hasta producir tareas artificiales sin valor o dependientes de detalles especulativos. Mantener cohesión técnica y una secuencia ejecutable.

## 4. Contrato de ejecución

El programador recibe un paquete de contexto acotado: historia aprobada, tarea, criterios relacionados, arquitectura/ADRs pertinentes, contratos de APIs/datos y convenciones del proyecto.

El programador DEBE:

1. **ejecutar primero la suite existente** y registrar el baseline (pruebas que ya fallaban antes de tocar nada), para no «arreglar» ni atribuirse fallos preexistentes;
2. inspeccionar el código relevante antes de cambiarlo;
3. describir brevemente el enfoque cuando el cambio no sea trivial;
4. implementar solo el alcance de la tarea, dentro de su superficie de cambio;
5. añadir o ajustar pruebas técnicas permitidas, siguiendo RED/GREEN/REFACTOR donde aplique (05 §3);
6. separar commits estructurales y conductuales (§8);
7. ejecutar los comandos de validación exactos de la tarea;
8. inspeccionar su propio diff para detectar archivos o cambios ajenos;
9. dejar el entorno como lo encontró: ningún servidor, proceso ni dato que el rol siguiente pueda tomar como propio (06 §10);
10. entregar un reporte con archivos modificados, pruebas ejecutadas, resultados, riesgos y decisiones/supuestos.

El programador NO DEBE:

- modificar criterios aprobados o pruebas de aceptación protegidas;
- alterar CI, permisos, políticas o configuraciones de agentes para facilitar su tarea;
- ocultar, saltar o silenciar pruebas fallidas;
- ampliar el alcance con refactorizaciones no relacionadas;
- añadir dependencias sin justificación y aprobación requerida;
- editar a mano código generado por herramientas (por ejemplo, migraciones): se regenera;
- introducir un patrón, una abstracción o una pieza que la nota de diseño no contempla: si cree que hace falta, se detiene con `BLOCKED` y la pregunta de diseño;
- borrar un marcador del guardián que no escribió (por ejemplo, un `#pragma` de código generado) para que el control deje de marcarlo: se reporta;
- afirmar que algo funciona sin evidencia de ejecución.

## 5. Dependencias y paralelismo

Las tareas pueden ejecutarse en paralelo solo si sus archivos, contratos y dependencias permiten trabajo independiente. El orquestador debe identificar conflictos de escritura y definir integración.

Se DEBERÍA usar ramas o worktrees separados para agentes concurrentes. No se permite que dos agentes escriban simultáneamente en los mismos archivos sin coordinación explícita.

## 6. Bloqueos

Si el agente descubre una dependencia, contradicción o cambio necesario fuera del alcance, debe detener esa parte, explicar el bloqueo y proponer opciones. No debe resolverlo ampliando unilateralmente la tarea.

Una **acción denegada** (por un permiso, un hook o un clasificador del harness) también es un bloqueo. El agente termina con `BLOCKED` e indica la acción exacta que necesita **del responsable humano**. No la intenta de otra forma ni le pide a otro agente que la haga: eso es un rodeo por delegación (06 §6.1).

## 7. Cierre de tarea

Una tarea puede pasar a revisión cuando:

- el resultado esperado está implementado;
- las pruebas aplicables se ejecutaron;
- el diff está limitado y revisado;
- no quedan cambios temporales o secretos;
- el reporte de ejecución está completo.

El cierre de una tarea no significa que la Historia de Usuario esté aceptada.

## 8. Commits estructurales y conductuales

Basado en *Tidy First* (Kent Beck).

- Cada commit MUST ser **estructural** (reorganiza código sin cambiar comportamiento; todas las pruebas verdes antes y después) **o conductual** (cambia comportamiento). Nunca ambos.
- Prefijos obligatorios: `struct:` para estructurales; `feat:`, `fix:` o `test:` para conductuales. El perfil puede mapearlos a Conventional Commits.
- Un cambio estructural fuera de la superficie de la tarea es fuera de alcance, aunque mejore el código. Se propone como tarea propia.

Efecto: un commit `struct:` se revisa comprobando que las pruebas siguen verdes; la atención humana y del verificador se concentra en los conductuales.

## 9. Circuit breaker e higiene de contexto

- Cada tarea MUST ejecutarse en una **sesión nueva**. No se reutiliza el contexto de una tarea anterior.
- Cuenta como ciclo `FAIL`: una CI roja por causa del cambio, un `FAIL` del verificador, o un hallazgo tras un `PASS` que el responsable humano manda corregir antes de integrar. No cuenta: una CI roja que solo espera una aprobación humana prevista (por ejemplo, la etiqueta de dependencias).
- Si una misma tarea acumula **3 ciclos `FAIL`** (CI o verificador), se detiene. No hay cuarto intento automático. El orquestador clasifica la causa y decide:
  - tarea mal especificada o demasiado grande → vuelve a refinamiento;
  - prueba de aceptación incorrecta → control de cambios con QA (05 §6);
  - problema de diseño → arquitecto o Spike;
  - limitación del modelo o del harness → reasignar o escalar al responsable humano.
- Si el agente repite el mismo enfoque fallido dos veces seguidas, el orquestador SHOULD reiniciar el contexto con un resumen escrito de lo aprendido en lugar de compactarlo: la compactación conserva los supuestos erróneos.
- El perfil puede reducir el umbral de 3 ciclos; aumentarlo requiere excepción documentada.

## 10. Camino corto para T0 y T1

T0 y T1 no recorren el ciclo de una historia, pero tampoco se improvisan. Pasos mínimos:

| Paso | T0 | T1 (defecto, chore o lote de estabilización) |
|---|---|---|
| Elemento en el backlog | Sí | Sí, con severidad si es defecto (02 §9) y con historia de origen |
| Especificación | La tarea | Un PR de especificación con el elemento, su criterio y la superficie. Aprobarlo es el gate humano |
| Comprobación de reproducción | — | Prueba de aceptación protegida o **comando de verificación** (05 §12), con RED confirmado; o «sin RED» declarado y aprobado (02 §8) |
| QA | No | Solo si la comprobación es una prueba de aceptación nueva |
| Tareas | Una | Las mínimas, agrupadas por superficie; cada una declara qué defectos deja en verde |
| CI | Guardián + validaciones | Guardián + validaciones + la comprobación del elemento + regresión |
| Verificador | No (salvo que el perfil lo exija) | Sí, ejecutando la comprobación él mismo |
| Cierre | Estado en el backlog | Estado, comprobación añadida a la regresión, hallazgos registrados |

Un T1 que, al trabajarse, resulta tocar comportamiento nuevo o un riesgo de T3 sube de track (02 §8).

## 11. Sesiones del orquestador

- El orquestador trabaja **una historia, enabler o lote por sesión**. Arrastrar el contexto de otro elemento encarece cada turno y mezcla decisiones; en el sandbox de AES, el contexto acumulado fue la mayor parte del costo de cada historia.
- La redacción mecánica (consolidar notas, tablas de métricas) SHOULD delegarse en un rol barato (el mecánico).

---

# 05 — Pruebas y calidad

## 1. Estrategia

AES combina ATDD (Acceptance Test-Driven Development) y TDD (Test-Driven Development), junto con pruebas de integración, extremo a extremo y controles estáticos. La selección depende del riesgo y del tipo de cambio.

## 2. ATDD: antes de implementar la historia

Para cada Historia de Usuario, QA o un rol independiente DEBE:

1. leer la petición y la historia aprobada;
2. derivar escenarios de aceptación desde los criterios;
3. identificar casos positivos, negativos y límites relevantes;
4. mapear cada criterio a una prueba o método de comprobación;
5. revisar que los escenarios prueben comportamiento, no una implementación supuesta;
6. proteger la versión aprobada de las pruebas.

Los escenarios de aceptación deben estar disponibles antes de declarar que la implementación está completa. Cuando sea viable, las pruebas automatizadas se escriben antes de la implementación.

### 2.1 Contrato de interfaz antes de las pruebas

QA no puede escribir pruebas útiles antes de que exista el código si no sabe por dónde entrar al sistema. Cuando la historia introduce o modifica una frontera observable, el orden es:

1. criterios de aceptación aprobados;
2. **contrato de interfaz** propuesto por el arquitecto/orquestador, en el plan técnico de la historia (03 §1.2): el punto de entrada observable que usarán las pruebas. Por defecto, la frontera externa del sistema:
   - HTTP/API: método, ruta, payload, códigos y forma de la respuesta;
   - CLI: comando, argumentos, salida y código de salida;
   - UI: flujo y selectores estables acordados (por ejemplo, `data-testid`);
   - librería: firmas públicas mínimas;
3. pruebas de aceptación escritas por QA contra ese contrato.

Las pruebas de aceptación MUST ejercitar comportamiento a través del contrato de interfaz, no detalles internos. Si el programador necesita cambiar el contrato, la tarea pasa a `BLOCKED` y se resuelve por control de cambios; el programador no adapta las pruebas. Si el contrato no puede definirse por incertidumbre real, primero se ejecuta un Spike cuyo resultado es precisamente el contrato.

### 2.2 RED confirmado

Una prueba que ya pasa antes del cambio no verifica el código nuevo: puede no estar ejercitando el comportamiento en absoluto. El paso rojo demuestra que la prueba es capaz de detectar la funcionalidad ausente.

Antes de que una historia pase a `Ready`, QA MUST ejecutar la suite de aceptación contra la rama base y registrar que **cada prueba nueva falla por la razón esperada** (por ejemplo, «404 en `/notifications`», no «error de importación» ni «timeout»). Una prueba nueva que pasa en verde contra la base se considera defectuosa hasta que se justifique. Este registro (`acceptance-baseline` en el plan de pruebas o artefacto de CI) forma parte de la DoR de la historia.

RED confirmado exige, además:

- que **todas** las pruebas nuevas se hayan **ejecutado**. Un error de compilación, de configuración o de arranque no es RED: no demuestra que ninguna aserción falle. Tampoco lo es una prueba que no llegó a correr (por ejemplo, por un modo serie que detiene la suite al primer fallo) ni una prueba omitida;
- que la comprobación la haga una **herramienta**, la misma en el entorno de QA y en la CI, sobre el reporte de la ejecución. «Las corrí por separado» no es evidencia: en el sandbox de AES, QA reportó un RED con dos pruebas sin ejecutar y la herramienta lo detectó;
- una única excepción, el **RED de arranque**: cuando la base todavía no tiene código de aplicación (el primer enabler), se acepta que ninguna prueba se ejecute porque no hay nada que arrancar. La herramienta solo la admite si la base no tiene código.

### 2.3 Pruebas visibles y holdout

La suite de aceptación SHOULD dividirse (MUST en T3) en:

- **visibles**: el programador puede leerlas y ejecutarlas; le dan el bucle de retroalimentación;
- **holdout**: variantes de los mismos criterios con datos y casos distintos, almacenadas donde el entorno del programador no tiene acceso (repositorio separado, rama sin permisos o directorio no montado). Solo las ejecutan la CI y el verificador.

Cuando una prueba holdout falla, el programador recibe el ID del criterio y el comportamiento observado, **no el código de la prueba**. Objetivo: detectar implementaciones ajustadas a los datos visibles (valores codificados, ramas especiales para el caso de prueba) sin quitar el feedback. Proporción orientativa: 20–30 % de los escenarios; el perfil la ajusta.

### 2.4 Pruebas de caracterización

A veces un criterio nuevo describe algo que el código **ya hace** (por ejemplo, el mismo mensaje de error en el formulario de alta que la historia nueva exige en el de edición). Su prueba pasa contra la base, así que no puede demostrar RED, y la regla de §2.2 la rechazaría junto con todo el conjunto.

Esas pruebas son de **caracterización**: documentan un comportamiento existente. Reglas:

- viven en la suite de la historia **dueña** de ese comportamiento (con su etiqueta, por ejemplo `@US-001`), y llevan en el título el ID del criterio nuevo para la trazabilidad;
- corren en la regresión desde que se integran;
- el criterio nuevo declara «Verificación: regresión de <ID>» y **no** aparece en el archivo de criterios de ninguna tarea (§12), porque no tiene pruebas propias que ejecutar;
- QA las marca como tales en el plan, y el responsable humano las aprueba con el resto.

No se inventan etiquetas que la CI no ejecuta: una prueba que nunca corre no verifica nada.

### 2.5 Aislamiento de datos

Las pruebas de aceptación corren en paralelo y comparten datos (la misma base, el mismo periodo, la misma lista). Cada prueba MUST:

- crear sus propios datos y buscarlos por algo que solo ella usa (una marca única en un texto, un periodo propio);
- no comparar totales o conteos globales que otras pruebas pueden cambiar mientras corre;
- no depender del orden de ejecución ni de lo que dejó otra prueba.

Una prueba que falla a veces no es ruido: es un defecto de severidad Alta (02 §9) si corre en la regresión de la rama principal, porque puede ponerla en rojo para todos.

## 3. TDD: durante la implementación

Para lógica nueva o modificada donde sea práctico, el programador SHOULD seguir:

1. **Red:** crear una prueba focalizada que falle por la razón esperada.
2. **Green:** implementar el cambio mínimo para pasarla.
3. **Refactor:** mejorar estructura sin cambiar el comportamiento y manteniendo todas las pruebas verdes.

No se exige TDD mecánico para cambios donde no aporta una prueba útil (por ejemplo, ciertos cambios visuales, documentación o configuración). En esos casos se documenta el método alternativo de verificación.

## 4. Capas de prueba

El perfil del proyecto define herramientas y comandos. En general:

- **Unitarias:** lógica aislada y casos de borde.
- **Integración:** persistencia, servicios, colas, APIs y límites entre componentes.
- **Contrato:** compatibilidad entre consumidores y proveedores.
- **E2E:** flujos de usuario que cruzan capas relevantes.
- **Aceptación:** criterios de la Historia de Usuario.
- **Regresión:** comportamiento existente que podría verse afectado.
- **No funcionales:** seguridad, rendimiento, accesibilidad, resiliencia u otras cualidades según riesgo.

No todas las historias requieren todas las capas. La omisión de una capa relevante debe justificarse.

## 5. Protección de pruebas de aceptación

Las pruebas que expresan criterios de aceptación aprobados constituyen un contrato independiente y DEBEN protegerse técnicamente.

El agente programador:

- puede crear y modificar pruebas unitarias/de integración propias del cambio, dentro del alcance;
- NO puede modificar o borrar la suite de aceptación protegida para conseguir un resultado verde;
- no puede cambiar workflows o configuración de CI que ejecutan esas pruebas.

Los cambios en pruebas protegidas requieren un cambio aprobado del requisito o una corrección de prueba demostrada, revisión independiente y aprobación de un responsable autorizado.

La CI MUST ejecutar la suite protegida obtenida desde la rama protegida (o verificar su integridad contra un manifiesto almacenado en ella), nunca la versión presente en la rama del agente. Este es un control de capa L3 (06 §9). CODEOWNERS, protección de rama, montajes de solo lectura y repositorios separados lo complementan.

No basta con confiar en el prompt del programador, ni tampoco en los permisos de su harness: un permiso que niega editar un archivo no impide escribirlo mediante la terminal.

## 6. Verificación de pruebas

Si una prueba falla, el equipo debe clasificar la causa antes de cambiar código o prueba:

- defecto de implementación;
- defecto en la prueba;
- requisito contradictorio o incompleto;
- entorno/configuración;
- dependencia externa.

El agente no debe borrar, deshabilitar, reducir aserciones ni cambiar datos esperados para ocultar un fallo. La corrección de una prueba es legítima solo si se demuestra que la prueba contradice el requisito aprobado o es técnicamente incorrecta.

Una prueba **inestable** (falla sin cambio de código) es técnicamente incorrecta. Se registra como defecto (02 §9), la corrige QA por el flujo autorizado de pruebas protegidas, y su comprobación no es un RED sino evidencia de estabilidad: el número de corridas que fallaban antes y una serie de corridas sin fallo después (el perfil fija cuántas; por ejemplo, 10). Su corrección no cambia lo que la prueba exige.

## 7. Calidad estática y seguridad

El perfil de proyecto debe declarar herramientas y umbrales aplicables: formato, lint, tipos, análisis estático, dependencias, secretos, vulnerabilidades y migraciones. Los umbrales deben ser razonados para el proyecto; AES no impone un porcentaje universal de cobertura.

Los cambios que afectan autenticación, autorización, datos personales, pagos, secretos, límites de confianza o migraciones requieren revisión reforzada y pruebas negativas pertinentes.

El **análisis estático de seguridad** (SAST, con reglas mapeadas a OWASP y CWE) SHOULD ejecutarse en la CI de cada tarea sobre lo que la tarea cambia:

- un hallazgo **nuevo** de severidad alta en el diff falla la tarea: es un hallazgo de la tarea (ciclo `FAIL`);
- un hallazgo nuevo de severidad menor y los hallazgos **preexistentes** no bloquean la tarea: el orquestador los registra como defectos con severidad (02 §9), y la compuerta de estabilización hace el resto;
- un falso positivo se suprime en la configuración de la herramienta, con motivo, y como cualquier marcador del guardián exige aprobación humana (05 §10).

La comprobación de dependencias con vulnerabilidades conocidas sigue la política del perfil.

Si el proyecto tiene interfaz, un **detector determinista de interfaz** (contraste, legibilidad, desbordes, accesibilidad básica, desviaciones del sistema visual del proyecto) SHOULD ejecutarse en la CI de cada tarea sobre los archivos de interfaz que cambia. Mientras el proyecto no haya decidido qué reglas bloquean, sus hallazgos se anotan en el PR y el orquestador los registra como defectos; después, las reglas que el perfil declare bloqueantes fallan la tarea, igual que el SAST. Las revisiones de diseño de un agente (crítica, puntuaciones de estilo) son hallazgos, no evidencia (00 §7).

## 8. Cobertura y mutation testing

La cobertura es una señal, no prueba de calidad. No se debe optimizar el porcentaje a costa de aserciones significativas.

Mutation testing SHOULD aplicarse a lógica crítica, autorización, cálculos sensibles y áreas donde sea importante saber si las pruebas detectan defectos. Su uso puede ser selectivo por coste.

## 9. Evidencia

Los resultados se registran con comando, estado (`PASS`, `FAIL`, `NOT RUN`, `BLOCKED`), entorno o versión relevante y resumen. No se aceptan pruebas reportadas como ejecutadas sin salida o evidencia verificable.

La evidencia válida es la salida capturada por la CI o por una herramienta que ejecuta el comando y registra su salida real (por ejemplo, el patrón `exec` de Showboat descrito por Simon Willison). Registrar la salida real, en lugar de lo que el agente esperaba que ocurriera, desincentiva fingir resultados. El texto redactado por un agente sobre lo que ejecutó no es evidencia.

Un check verde no prueba que se ejecutó lo esperado. La CI MUST imprimir qué ejecutó (tipo de rama, elemento, criterios o etiquetas, número de pruebas), y el orquestador y el humano lo confirman en el log antes de dar el gate por superado. En el sandbox de AES, un cierre salió en verde sin ejecutar ni una prueba de su historia.

Las afirmaciones sobre el repositorio se comprueban en su fuente (00 §7).

## 10. Guardián de CI: superficie de cambio y detector de trampas

La CI MUST incluir un guardián que, como mínimo:

1. **rechaza modificaciones a rutas protegidas** (suite de aceptación, especificaciones, CI, configuración de agentes, hooks, `AGENTS.md`/`CLAUDE.md`);
2. **compara el diff con la superficie de cambio** de la tarea, leída desde la rama protegida;
3. **rechaza cambios en manifiestos y lockfiles** de dependencias sin aprobación;
4. **detecta archivos de prueba eliminados**;
5. **busca marcadores de trampa en las líneas añadidas**:

| Señal | Ejemplos |
|---|---|
| Pruebas omitidas | `.skip(`, `xit(`, `xdescribe(`, `@Disabled`, `@Ignore`, `#[ignore]`, `pytest.mark.skip`, `[Fact(Skip=` |
| Analizadores silenciados | `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `# type: ignore`, `#pragma warning disable`, `noqa` |
| Errores tragados | `catch {}` o `catch (e) {}` vacíos, `except: pass` |

Una coincidencia no siempre es trampa, pero siempre requiere justificación en el reporte de la tarea y una aprobación explícita de alguien distinto del programador. El perfil añade los patrones propios de su stack.

Dos precisiones aprendidas en la práctica:

- **Dependencias** incluye las fuentes de paquetes y las herramientas locales, no solo los manifiestos: cambiar de dónde salen los paquetes es tan sensible como cambiar un paquete (por ejemplo, `nuget.config`, `.npmrc`, `pip.conf`, `global.json`, manifiestos de herramientas).
- **El código generado** por herramientas (por ejemplo, migraciones) contiene marcadores que nadie escribió a mano. Si el guardián lo excluye de la búsqueda, la exclusión MUST ser estrecha: una ubicación conocida **y** el encabezado de generación, de modo que un encabezado puesto a mano en otro archivo no esconda un marcador. Los archivos excluidos se listan en la salida para el verificador.

La cobertura de los archivos tocados SHOULD compararse con el baseline; una caída se trata igual que un marcador de trampa.

## 11. Prueba manual agéntica

Que todas las pruebas pasen no garantiza que el programa arranque o que un elemento de la interfaz sea visible. Para T2 y T3 con interfaz de usuario o API, el verificador MUST arrancar la aplicación y ejercitar los flujos de los criterios con la herramienta adecuada:

- APIs: servidor de desarrollo y peticiones reales (`curl` o equivalente);
- interfaces web: automatización de navegador (por ejemplo, Playwright) con capturas;
- CLI y librerías: ejecución real, con scripts temporales fuera del repositorio.

Las salidas y capturas se adjuntan al informe de verificación. Un defecto encontrado así se clasifica (02 §9.3): si es de lo que añade la tarea, es un ciclo `FAIL`; si no, se registra como T1 con severidad y se corrige con RED/GREEN, de modo que quede una comprobación automatizada permanente.

Reglas adicionales:

- **Sin prueba manual no hay `PASS`.** Si el track la exige y el verificador no pudo hacerla, el resultado es `BLOCKED`, no `PASS`: las pruebas automatizadas, aunque pasen, no la sustituyen. En el sandbox de AES, un verificador la omitió porque «la aceptación ya usa servidores reales».
- La prueba manual usa **datos distintos** de los de las pruebas automatizadas.
- Los servidores se arrancan y se detienen con una herramienta que **siempre** detiene lo que arrancó y solo eso, sobre datos temporales propios, y que falla si el puerto ya está ocupado en lugar de reutilizar un servidor ajeno (06 §10).

## 12. Qué ejecuta la CI en cada fase

La CI decide qué pruebas ejecutar según el tipo de rama y la rama destino (`dev` o `main`, 07 §7). El perfil fija los nombres de rama; la intención es esta:

| Fase | Qué ejecuta |
|---|---|
| Especificación de un T1 con comando de verificación | El comando, que **debe fallar** (RED), salvo «sin RED» aprobado |
| Pruebas de aceptación de un elemento (`qa/<ID>`) | Las pruebas del elemento, que **deben ejecutarse y fallar** (RED, §2.2) |
| Tarea | Guardián + validaciones + los criterios que declara la tarea (o el elemento completo, si es la última) + regresión |
| Cierre del elemento | El elemento completo, que **debe ejecutarse y pasar**, + regresión |
| `dev` y `main` | Regresión de todos los elementos cerrados en esa rama |
| Release (`dev` → `main`) | Regresión completa + compuerta de estabilización + `main` contenido en `dev` (07 §8) |
| Back-merge (`main` → `dev`) | Regresión completa de `dev` |

Reglas:

- El archivo de criterios de cada tarea se lee de la **rama protegida**, igual que la superficie de cambio.
- La regresión incluye las pruebas de aceptación **y** los comandos de verificación de todos los elementos cerrados.
- Un **comando de verificación** es un criterio que no se comprueba con una prueba de aceptación (configuración, herramientas, scripts, build). Es un script versionado en la ruta protegida del elemento, que termina con código 0 si el criterio se cumple. Se trata como una prueba protegida: lo escribe quien escribe las pruebas, lo aprueba el humano y la CI lo ejecuta desde la rama protegida.
- Entre la integración de la última tarea de un elemento y la de su cierre no se integra nada más en esa rama (`dev`, o `main` en un hotfix): durante ese intervalo la regresión todavía no incluye el elemento.
- La lista de elementos en regresión es un archivo versionado. Viaja con los releases y los back-merges, así que la regresión de `main` cubre lo liberado y la de `dev`, todo lo integrado.

---

# 06 — Gobierno de agentes y permisos

## 1. Objetivo

Separar responsabilidades, limitar el contexto y restringir las acciones de cada agente para reducir desviaciones, conflictos, filtraciones y autoaprobación.

## 2. Roles base

### Responsable humano del producto

- aprueba visión, prioridades y criterios de producto;
- resuelve ambigüedades materiales;
- aprueba cambios materiales de alcance, arquitectura transversal, seguridad y decisiones irreversibles;
- acepta el producto/funcionalidad según el perfil del proyecto.

### Orquestador

- mantiene el estado del backlog y del ciclo;
- asigna agentes y les entrega contexto mínimo suficiente;
- verifica que la tarea cumple DoR;
- controla dependencias, límites y gates;
- agrega evidencias y comunica bloqueos;
- no altera requisitos para acomodar una implementación;
- es el **diseñador senior**: decide los patrones del nivel 2 de cada tarea en una nota de diseño, a partir de hechos y no del relato de otro agente (10 §5).

### Arquitecto

- inspecciona arquitectura actual;
- identifica impactos, alternativas y riesgos;
- propone cambios y ADRs;
- no impone cambios materiales sin aprobación.

### QA / Diseñador de pruebas

- deriva escenarios desde criterios aprobados;
- crea y mantiene la suite protegida en un espacio/flujo autorizado;
- comprueba trazabilidad y casos negativos;
- no implementa la funcionalidad que está definiendo como aceptación.

### Programador

- implementa tareas asignadas;
- añade pruebas técnicas permitidas;
- no modifica contratos de aceptación ni aprueba su trabajo;
- reporta supuestos, desviaciones y bloqueos.

### Mecánico (opcional)

- ejecuta tareas mecánicas dentro de una superficie de cambio: configuración no funcional, renombres, formato, consolidación de notas y métricas;
- tiene los permisos del programador, limitados a su tarea;
- si la tarea exige decidir comportamiento o diseñar, se detiene con `BLOCKED`: esa tarea no es mecánica.

### Verificador

- inspecciona la especificación, el diff y las evidencias;
- ejecuta o revisa pruebas según permisos;
- busca incumplimientos, regresiones, riesgos y sobreingeniería;
- es de solo lectura respecto al código bajo revisión;
- no cambia el alcance ni corrige silenciosamente el trabajo.

## 3. Matriz base de permisos

La aplicación exacta se define en el perfil, pero la intención no debe cambiar:

| Recurso/acción | Orquestador | Arquitecto | QA | Programador | Verificador |
|---|---|---|---|---|---|
| Leer repositorio | Sí | Sí | Sí | Sí | Sí |
| Proponer requisitos | Sí | Consulta | Consulta | No | No |
| Aprobar alcance de producto | No, recomienda | No | No | No | No |
| Proponer ADR | Sí | Sí | No | Puede sugerir | Puede señalar |
| Aprobar ADR reservado | No | No | No | No | No |
| Escribir pruebas de aceptación protegidas | No, coordina | No | Sí, flujo autorizado | No | No |
| Modificar código de producción | Según necesidad/configuración | No por defecto | No | Sí, dentro de tarea | No |
| Modificar pruebas unitarias/integración | No por defecto | No | Puede revisar | Sí, dentro de tarea | No |
| Escribir/leer pruebas holdout | Coordina, no lee | No | Sí, flujo autorizado | **No** (ni lectura) | Ejecuta |
| Publicar superficie de cambio de una tarea | Sí, en rama protegida | Consulta | No | No | No |
| Modificar CI/protecciones | No sin autorización | No | No | No | No |
| Modificar `AGENTS.md`, hooks, skills, permisos | Propone; requiere aprobación humana | No | No | No | No |
| Ejecutar pruebas | Sí | Sí | Sí | Sí | Sí |
| Aprobar su propio trabajo | No | No | No | No | No |
| Emitir informe de verificación | No sustituye | Puede aportar | Puede aportar | No | Sí |

El mecánico, cuando existe, tiene la columna del programador.

## 4. Aislamiento del verificador

El verificador debe iniciar una ejecución separada y recibir directamente:

- petición original relevante;
- Historia de Usuario aprobada y criterios de aceptación;
- ADRs/contratos aplicables;
- diff real y commit/branch inspeccionados;
- resultados originales de CI y pruebas;
- instrucciones de verificación.

No debe recibir como fuente de verdad el razonamiento privado, la autoevaluación ni el resumen promocional del programador. Puede leer el código y los artefactos necesarios para comprobar el resultado.

La independencia depende principalmente de la separación de permisos, contexto y evidencia. Usar otro proveedor/modelo puede aportar diversidad, pero no sustituye esos controles.

El orquestador puede añadir **puntos de atención**: hechos concretos y comprobables (un commit, un archivo, un cambio de comportamiento que notó), nunca conclusiones. El verificador los trata como hipótesis que comprueba él mismo.

La verificación ocurre **antes de integrar**. Verificar después (por ejemplo, porque se integró por error) es un incidente que se registra, y pierde información: con integración por *squash*, el verificador ya no ve los commits individuales.

El verificador MUST volver a ejecutar las validaciones en lugar de aceptar las del programador, ejecutar las pruebas holdout cuando existan y realizar la prueba manual agéntica que corresponda al track (05 §11). Además vigila las señales de desvío que Kent Beck describe en *Augmented Coding: Beyond the Vibes*:

1. bucles: código repetitivo o innecesario, o el agente atascado repitiendo intentos;
2. funcionalidad no pedida, aunque parezca el siguiente paso razonable;
3. cualquier indicio de trampa, como desactivar, borrar o debilitar pruebas.

Cualquiera de las tres es motivo suficiente para `FAIL`.

## 5. Contexto mínimo suficiente

El orquestador debe entregar información relevante, no todo el historial del chat o el repositorio indiscriminadamente. El paquete suele incluir: tarea, historia, criterios relacionados, arquitectura/ADRs pertinentes, contratos y convenciones, rutas relevantes y comandos de validación.

Los agentes deben indicar qué información falta. No deben rellenar vacíos inventando APIs, estructuras o reglas.

El contexto entregado SHOULD ser **estructural** (comandos exactos, rutas, superficie de cambio, pruebas afectadas, contratos) y no **procedimental genérico** (04 §2).

### 5.1 Instrucciones persistentes (`AGENTS.md`, `CLAUDE.md` y equivalentes)

- MUST NOT contener instrucciones de proceso genéricas («usa TDD», «escribe código limpio», «ejecuta las pruebas relevantes»). No añaden información y consumen contexto.
- SHOULD ser breves y contener: comandos de build/prueba/lint, rutas prohibidas, restricciones arquitectónicas, convenciones que un linter no detecta y fallos observados del agente.
- SHOULD empezarse tarde y crecer **una entrada por cada error real** que valga la pena registrar (09).
- En repositorios grandes SHOULD apuntar a los archivos relevantes en lugar de copiar su contenido.
- Están en rutas protegidas: el programador no puede modificarlas.

## 6. Herramientas, MCP, skills y hooks

- **Harness:** ejecuta el ciclo del agente y controla contexto/herramientas.
- **MCP:** expone herramientas o recursos externos.
- **Skills:** instrucciones/procedimientos reutilizables para un agente.
- **Hooks:** automatizan acciones ante eventos definidos.
- **CLI/API:** permiten delegar a otro proceso o servicio.

El perfil del proyecto define implementaciones concretas. Una skill no concede permisos. Un MCP no debe exponer más privilegios de los necesarios. Los hooks no sustituyen CI ni revisión.

Skills:

- SHOULD construirse **después** de evaluar al agente en tareas representativas y observar dónde falla, no por anticipado (09).
- MUST instalarse solo desde fuentes confiables. Las de terceros se auditan antes de usarlas: archivos incluidos, scripts, dependencias y cualquier instrucción que conecte con redes externas no confiables.

### 6.1 Acciones denegadas y rodeo por delegación

Cuando un permiso, un hook o un clasificador del harness deniega una acción a un agente, el agente puede intentar conseguirla por otra vía: otro comando, o pedirle a otro agente que la haga. Lo segundo es un **rodeo por delegación**, y ningún control técnico lo detecta: en el sandbox de AES, dos subagentes pidieron al orquestador que detuviera procesos que a ellos se les había denegado detener.

Reglas:

- Una acción denegada es `BLOCKED` **para el responsable humano**, con la acción exacta que hace falta.
- Ningún agente ejecuta una acción que se le denegó a otro rol, aunque él sí tenga permiso.
- El orquestador registra el caso y se lo pasa al humano; no lo resuelve.

### 6.2 Tipos de skill y núcleo de AES

Las skills potencian la metodología si encajan en ella, y la paralizan si compiten con ella. AES distingue tres tipos:

| Tipo | Qué es | Regla |
|---|---|---|
| **Técnica** | Cómo hacer bien una actividad: depurar, revisar seguridad, escribir una nota de diseño | Se asigna a los roles que hacen esa actividad. MUST NOT contradecir un gate, un contrato ni un permiso de AES |
| **Herramienta** | Envuelve un análisis determinista (análisis estático, grafo de código) | Lo que la herramienta detecta de forma determinista SHOULD ejecutarse en la CI (L3); la skill ayuda a interpretar y corregir, no es el control |
| **Flujo** | Orquesta el ciclo completo: planes, ejecución, revisión, cierre de ramas | MUST NOT instalarse junto a AES. Dos metodologías dando instrucciones sobre lo mismo hacen que el agente elija una distinta cada vez |

Reglas para toda skill:

- **Versión fija y revisada:** se copia al repositorio en una versión concreta, dentro de una ruta protegida, y la revisa el responsable humano. Nada de plugins o skills que se actualizan solos: una actualización silenciosa cambia las instrucciones de los agentes sin aprobación.
- **Registrada en el perfil:** origen, versión o commit, licencia, quién la revisó y qué roles la usan.
- **Sin consultas de red propias:** los avisos de actualización, las actualizaciones automáticas y la telemetría de una skill se desactivan en el proyecto (variable de entorno o configuración). Una actualización es un cambio de versión, y entra por PR como cualquier otro. Se aceptan las descargas que el propio paquete fija en su versión y verifica con huellas incluidas en él, como un lockfile. Una consulta que no se puede desactivar (por ejemplo, un catálogo de opciones) se registra en el perfil, se usa solo con el responsable humano presente y nunca envía código ni datos del proyecto.
- **Sin servidores ni procesos que queden vivos** al terminar el paso que los abrió (§10). Si la skill los arranca, el paso termina deteniéndolos.
- **Se instala con AES:** el instalador de AES copia el núcleo y las skills de terceros registradas, en su versión fija, para que ninguna se quede atrás al instalar o actualizar AES.
- **Hooks y scripts incluidos** se revisan como código propio, y respetan las demás reglas (por ejemplo, no dejar procesos vivos entre roles, 06 §10).
- **Su salida no es evidencia** salvo que ejecute un comando y muestre la salida real (00 §7).
- **Pocas por rol:** cada skill disponible ocupa contexto; un rol carga las que su trabajo necesita.

AES mantiene un **núcleo de skills propias** (`skills/` en el repositorio de AES), escritas para sus gates y contratos, en el formato abierto de Agent Skills. No son obligatorias: un proyecto puede usar otras equivalentes si cumplen las reglas anteriores. Cuando una skill de terceros es buena pero de tipo flujo, o depende de otras de su paquete, se escribe una propia tomándola como referencia, con atribución y respetando su licencia.

## 7. Secretos y entornos

Los agentes no deben imprimir, copiar a reportes ni incluir en commits secretos, credenciales, tokens, datos personales reales o archivos de entorno. Los entornos de prueba deben usar datos sintéticos o anonimizados cuando sea posible. Los agentes reciben credenciales solo si su tarea las necesita y con privilegio mínimo.

## 8. Aprobaciones humanas obligatorias

Requieren aprobación humana previa:

- cambio material de visión, alcance o comportamiento de producto;
- decisión arquitectónica transversal o difícil de revertir;
- cambio en autenticación, autorización, seguridad o manejo de datos sensibles;
- migración destructiva o acción irreversible sobre datos;
- coste externo significativo o nuevo servicio de pago;
- cambio de políticas de permisos, CI o suite protegida;
- excepción a un control fundamental;
- aceptación final de una funcionalidad/producto cuando el perfil lo requiera.

Los detalles rutinarios, locales y reversibles pueden delegarse si respetan la arquitectura y las convenciones.

Cuando la aprobación se expresa en la CI (por ejemplo, con una etiqueta en el PR que autoriza dependencias o marcadores), la CI SHOULD comprobar **quién** la dio: una persona autorizada, no la identidad de los agentes. Una etiqueta que la identidad de los agentes puede poner no es una aprobación. Si la plataforma no permite comprobarlo, se usa una revisión aprobada en su lugar.

La **verificación independiente** es una condición de integración que no debe depender de la memoria de nadie. El `PASS` del verificador SHOULD quedar como evidencia que la CI o la protección de rama exigen antes de integrar una tarea (por ejemplo, una etiqueta de verificación que solo puede poner el responsable humano tras leer el informe, comprobada como en el párrafo anterior). En el sandbox de AES, una tarea se integró antes del `PASS` cuando el aviso del orquestador no lo recordaba, y la regla se cumplió en la historia siguiente solo porque el aviso lo decía.

## 9. Modelo de controles en capas

Un permiso del harness no equivale a un control que el agente no puede esquivar. Ejemplo: en OpenCode, el permiso `edit` cubre las herramientas de edición, escritura y parche, pero una terminal permisiva puede escribir el mismo archivo con `sed` o una redirección.

Un control solo se considera **técnico** (principio 8) si el agente **no puede desactivarlo ni esquivarlo desde su propio entorno de ejecución**. AES distingue tres capas:

| Capa | Dónde vive | Qué hace | ¿Puede esquivarla el agente? |
|---|---|---|---|
| **L1 — Harness** | Permisos del harness (por ejemplo `opencode.json`, permisos de Claude Code) | Niega edición de rutas, limita comandos. | Parcialmente (terminal, configuración editable). Es **fricción**, no garantía. |
| **L2 — Hooks** | Hooks del harness (`PreToolUse`, `Stop`, plugins) | Bloquea escrituras a rutas protegidas; impide terminar con pruebas rojas. | Solo si puede editar la configuración de hooks, que debe estar protegida en L1 y L3. |
| **L3 — Fuera del agente** | CI desde ref confiable, protección de rama, CODEOWNERS, montajes de solo lectura, repositorios separados | Ejecuta la suite protegida desde la rama principal; verifica integridad, superficie y marcadores de trampa. | **No.** Es la única capa que cuenta como gate. |

Reglas:

- Los controles fundamentales (protección de la suite de aceptación, independencia de verificación, rutas protegidas, superficie de cambio) MUST existir en L3.
- La configuración del harness, los hooks, la CI y las instrucciones persistentes MUST estar en rutas que el programador no puede editar (L1) y cuya modificación hace fallar la CI (L3).
- El programador SHOULD trabajar en un worktree o contenedor donde la suite holdout no existe y la suite visible está montada en solo lectura.
- Si la CI se define en archivos del propio repositorio, una rama puede modificar su propio workflow para saltarse el guardián. Las credenciales con las que se publican ramas de programador MUST NOT tener permiso para modificar workflows (en GitHub, un token sin el permiso *Workflows*), o la plataforma MUST imponer el workflow desde fuera de la rama (por ejemplo, workflows obligatorios a nivel de organización).
- MUST NOT presentarse L1 o L2 como suficientes para un control fundamental.
- Si el responsable humano necesita poder integrar sus propios cambios (nadie puede aprobar su propio PR), el permiso de saltarse la aprobación MUST NOT alcanzar a los checks obligatorios. En GitHub: dos rulesets, uno con los checks y sin bypass, otro con la aprobación y un bypass solo para PR. Un único ruleset con bypass permite integrar con la CI en rojo; en el sandbox de AES pasó.
- Los agentes publican con una **identidad propia**, distinta de la del humano, y sus commits llevan esa misma autoría. Así la aprobación del humano es real y el historial distingue quién escribió qué.
- **Aislamiento del sistema de archivos:** la terminal de un agente puede escribir fuera del repositorio, y ninguna de las tres capas lo detecta. Si el disco tiene algo sensible, los roles que escriben SHOULD trabajar en un entorno aislado (contenedor, máquina virtual o el aislamiento de terminal del harness); si no, el perfil lo declara como excepción.

`profiles/reference/` contiene una implementación de referencia de las tres capas.

## 10. Estado entre roles

Un rol no debe dejar nada que el siguiente pueda tomar como propio: servidores escuchando, procesos, datos de prueba o archivos temporales dentro del repositorio. Si la aceptación reutiliza un servidor que dejó vivo otro rol, puede pasar contra código viejo; en el sandbox de AES, los servidores de un verificador bloquearon la compilación del programador siguiente.

Cada rol que lee o escribe una rama de trabajo SHOULD hacerlo en un **checkout propio** de esa rama (por ejemplo, un *worktree* de git), no en el checkout del orquestador:

- el orquestador se queda en `dev` y no cambia de rama; los roles no heredan sus archivos sin versionar ni él los suyos;
- el verificador revisa una copia limpia de la rama, no la que acaba de usar el programador;
- los archivos locales que un rol necesita y no están versionados (credenciales de su identidad, configuración local) se copian al checkout de forma explícita, nunca se versionan;
- si varios roles trabajan a la vez, cada checkout necesita sus propios puertos y datos; hasta que el perfil lo resuelva, los roles se ejecutan de uno en uno.

- Los servidores se arrancan con una herramienta que los detiene siempre al terminar y que **no reutiliza** un servidor ajeno: si el puerto está ocupado, falla.
- Al terminar cada rol, un control comprueba que no quedó nada escuchando en los puertos del proyecto (L2 en la implementación de referencia; en la CI, cada ejecución empieza limpia).
- Si un agente no puede detener algo que arrancó, es una acción denegada (§6.1).

## 11. Modelo y harness por rol

El perfil declara qué harness y qué modelo ocupa cada rol. El **orquestador** MUST correr en el modelo más capaz disponible: decide el diseño (10 §5), clasifica tracks, severidades y hallazgos, y es el único rol que ve el ciclo completo. Los demás roles pueden usar modelos más baratos porque reciben instrucciones desglosadas y su trabajo se verifica. La evidencia de cada elemento (09 §6) registra el modelo **real** de cada rol en esa ejecución, no el declarado: si cambian, las comparaciones de costo y calidad entre elementos no valen.

## 12. Roles en otro harness

Un rol MAY correr en un harness distinto al del orquestador (por ejemplo, el orquestador en Claude Code y el programador en OpenCode con otro proveedor), siempre que el perfil lo declare en su tabla de roles (§11) y se cumpla lo siguiente:

1. **El mismo contrato.** El rol recibe las mismas instrucciones que en el harness principal, desde el mismo archivo; no hay una segunda versión que se desfase.
2. **L1 equivalente** (§9): permisos del harness que niegan las rutas protegidas, la publicación (push, PR), la red que el rol no necesita y las preguntas interactivas. En una ejecución sin interfaz, una acción que pediría confirmación MUST rechazarse, nunca aprobarse sola.
3. **L2 equivalente o hueco declarado:** las mismas comprobaciones que los hooks del harness principal, preferiblemente ejecutando los mismos scripts. Si el harness no permite alguna, el perfil la registra como hueco conocido.
4. **L3 sin cambios:** la CI y la compuerta de fin de rol (servidores, guardián, validaciones) se aplican igual, porque no dependen del harness.
5. **Sin credenciales de publicación** en el entorno del rol: publica el orquestador (§10).
6. **Costo por delegación:** cada ejecución registra modelo, tokens (entrada, salida, razonamiento, caché) y costo estimado con el precio de lista del proveedor, incluidos los recargos por horario, aunque el modelo se use gratis. La retrospectiva del elemento resume el costo por rol (09 §6).
7. **Versión probada y entorno comprobado:** el perfil registra con qué versiones del otro harness se probó la delegación, y antes de delegar se comprueba que el harness acepta lo que la delegación usa y que el modelo responde. Un cambio de versión del harness no debe descubrirse como un rol que no se ejecutó.
8. **Plan del proveedor adecuado a la tarea:** un plan gratuito o con límite de uso corto MUST NOT usarse para tareas que compilan o duran más que su ventana; un corte a mitad de tarea deja trabajo sin compuerta. La fila de costo se registra también cuando el proveedor falla.
9. **Datos fuera del proveedor principal:** el perfil registra a qué proveedor va el código y el contexto de cada rol, y sus condiciones de retención y entrenamiento. Un proyecto con datos sensibles no delega en un proveedor que retiene o entrena con ellos.

### 12.1 Nivel de modelo por tarea

El binding de un rol es un valor por defecto, no una obligación para todas sus tareas. Una tarea MAY pedir otro **nivel de modelo** (por ejemplo, «alto») o un binding concreto, cuando lo que pide supera lo que el modelo por defecto hace bien:
- **contexto muy grande que hay que leer entero:** un esquema o una base de datos heredada, un módulo antiguo, un volcado de registros;
- **razonamiento que cruza muchas piezas:** una migración de datos con reglas, un cambio de concurrencia, de seguridad o de un protocolo;
- **fallos repetidos del nivel estándar** por defectos del código (no de la especificación): tras dos ciclos FAIL así, el orquestador MAY proponer el nivel alto para el siguiente.

El orquestador propone el nivel en la especificación de la tarea, con el motivo, y el humano lo aprueba junto con las tareas. Sin motivo, una tarea usa el nivel estándar: el nivel alto cuesta más y gasta los límites del proveedor principal. El perfil define qué binding tiene cada nivel y para cada rol; el verificador de una tarea de nivel alto MAY subir también de nivel. Cuando el programador y el verificador quedan en la misma familia de modelos, el perfil lo anota como hueco del SHOULD de abajo.

Si la tarea ve **datos reales** (una base de datos de producción o heredada, registros con datos personales), el nivel elegido MUST respetar el punto 9: si el proveedor de ese nivel retiene o entrena con lo que recibe, la tarea trabaja con el esquema y una muestra anonimizada, o se elige otro proveedor.

El verificador SHOULD correr en una familia de modelos distinta a la del programador: un modelo que revisa su propio tipo de errores los detecta peor.

---

# 07 — Cambios, riesgos y liberación

## 1. Control de cambios

Una nueva información puede justificar cambiar una historia o decisión. El cambio se registra; no se reescribe el objetivo silenciosamente.

Un cambio de alcance o criterios después de `Ready` requiere:

1. describir qué cambió y por qué;
2. identificar impactos en arquitectura, tareas, pruebas, estimación y dependencias;
3. actualizar los artefactos afectados;
4. obtener la aprobación correspondiente;
5. volver a ejecutar DoR para la parte afectada.

Correcciones editoriales sin cambio semántico no requieren un ciclo completo.

## 2. Riesgo

Cada historia debe identificar riesgos relevantes. Como mínimo, evaluar si toca:

- autenticación, autorización o límites de confianza;
- datos personales, financieros o sensibles;
- pagos, facturación o proveedores externos;
- migraciones, borrado o integridad de datos;
- APIs o contratos utilizados por otros sistemas;
- concurrencia, rendimiento o disponibilidad;
- despliegue, recuperación o continuidad.

El perfil puede usar niveles `Low`, `Medium`, `High` y `Critical`, con controles definidos. Los elementos High/Critical requieren revisión reforzada y aprobación humana según el tipo de riesgo, y se tratan como track T3 (02 §8): pruebas holdout obligatorias y revisión humana del código de las zonas de riesgo.

## 3. Bloqueos y fallos

Cuando una validación falla, el orquestador detiene el avance del gate afectado, clasifica el fallo y asigna una corrección delimitada. No se continúa marcando como terminado el trabajo dependiente. Los fallos repetidos sobre la misma tarea activan el circuit breaker (04 §9).

Un bloqueo debe incluir: qué falta, por qué bloquea, evidencia disponible, opciones y quién puede resolverlo.

Cuando una historia se bloquea porque necesita algo que no está en su alcance (otra historia, una decisión, una pieza técnica), el alcance **nunca se amplía en silencio**. El responsable humano elige entre:

1. **ampliar** la historia por control de cambios (§1), si lo que falta es pequeño y del mismo resultado;
2. marcarla `Blocked` por el elemento que falta, que pasa delante en el backlog;
3. **dividirla**, entregando ahora la parte que no depende de lo que falta;
4. abrir un **Spike** (01 §7), si lo que falta es conocimiento.

La elección es una decisión registrada en la historia (03 §8).

## 4. Integración

Cada cambio debe integrarse mediante el mecanismo del proyecto (pull request, merge request o equivalente). Se debe revisar:

- alcance del diff;
- conflictos y compatibilidad;
- pruebas y CI;
- migraciones y rollback cuando aplique;
- configuración y secretos;
- documentación y observabilidad necesarias.

No se deben integrar cambios solo porque un agente terminó su tarea.

Una tarea no se integra sin el `PASS` del verificador, aunque la CI esté en verde (06 §8). Antes de añadir commits a la rama de un PR, se comprueba que el PR sigue abierto: publicar en una rama ya integrada y borrada la recrea con trabajo que nadie revisará.

## 5. Liberación

La liberación sigue el perfil del proyecto y el proceso de release (§8), y debe considerar, cuando aplique:

- versión y notas de cambio;
- migraciones y plan de recuperación;
- configuración por entorno;
- monitoreo y alertas;
- estrategia de rollback o mitigación;
- aprobación humana para cambios de riesgo alto.

La aceptación de una Historia de Usuario no implica automáticamente autorización para desplegar a producción.

## 6. Defectos

Los defectos se registran con severidad y se gestionan con la compuerta de estabilización (02 §9): un defecto Crítico detiene todo; uno Alto o Medio impide empezar la historia siguiente; los Menores se acumulan solo hasta el límite del perfil. Los defectos se corrigen en lotes de estabilización, en su propia sesión, sin mezclarse con funcionalidad nueva.

## 7. Ramas: `main` y `dev`

Todo proyecto AES MUST tener dos ramas permanentes y protegidas:

| Rama | Contiene | Recibe |
|---|---|---|
| `main` | Lo liberado: estable, verificado y aceptado como producto | Solo releases desde `dev` (§8) y hotfixes (§9) |
| `dev` | Lo integrado: historias aceptadas, lotes y tareas terminadas, aún sin liberar | Las ramas de trabajo de cada elemento (especificación, pruebas, tareas, cierre) y los back-merges desde `main` (§9) |

Reglas:

- La regla es la misma en proyectos pequeños y grandes. No hay variante «solo `main`» ni *feature flags* como sustituto: un flag es código condicional que un agente puede escribir mal, y revisar que algo queda apagado obliga a leer el código. El aislamiento lo da git.
- `dev` MUST estar siempre en verde, con la misma CI y la misma protección que `main`. Es la base de todo el trabajo nuevo.
- Las ramas de trabajo son **cortas**: nacen de `dev` (o de `main`, si son de un hotfix) y desaparecen al integrarse. No hay ramas permanentes de features ni de bugs: una rama larga se desfasa y vuelve a traer los conflictos que se querían evitar.
- Una épica de muchas historias se construye en `dev` y sale a `main` cuando el responsable humano la libera. `main` nunca recibe una funcionalidad a medias.
- La compuerta de estabilización (02 §9) se evalúa sobre `dev` para empezar historias, y sobre el candidato a release para liberar.

## 8. Release (`dev` → `main`)

Un release es un PR de `dev` a `main`. Es un gate humano propio, distinto de la aceptación de cada historia: aceptar una historia dice que cumple sus criterios; liberar dice que el conjunto se puede usar como producto.

Antes de abrirlo:

- se preparan las notas del release (plantilla `templates/release.md`): qué elementos salen, qué defectos conocidos quedan y cómo se vuelve atrás;
- la compuerta de estabilización está abierta sobre `dev`;
- `main` está contenido en `dev` (§9): todo hotfix previo ya volvió a `dev`.

El PR de release:

- ejecuta la regresión completa de `dev`;
- MUST fallar si `main` tiene commits que `dev` no tiene (en git: `main` no es ancestro de `dev`). Así un hotfix que no volvió a `dev` no puede perderse ni reintroducir el defecto;
- se integra con **merge commit**, no con *squash*. Con *squash*, los commits de `main` dejan de existir en `dev`, la comprobación anterior falla siempre y cada release trae conflictos. El *squash* se reserva para las ramas de trabajo;
- lo aprueba e integra el responsable humano. No hay un periodo mínimo de uso: el responsable usa `dev` todo lo que considere necesario, y su aprobación del PR es la evidencia de que lo hizo.

Después de integrarlo:

- los elementos incluidos pasan a `Released`;
- se hace un back-merge de `main` a `dev` (§9), porque el commit del release solo existe en `main`;
- la versión se marca según el perfil (por ejemplo, con un tag).

## 9. Hotfix y back-merge

Un **hotfix** corrige un defecto de algo que ya está en `main`, sin pasar por lo que está en construcción en `dev`.

- El responsable humano decide la ruta de cada defecto de algo liberado, sea cual sea su severidad: **hotfix** (sale ya, desde `main`) o **`dev`** (sale con el próximo release). La decisión se registra en el defecto (03 §8). El orquestador propone; lo habitual es hotfix para lo Crítico o Alto, pero no es una regla.
- Un hotfix es un elemento T1 (04 §10) cuyas ramas de trabajo nacen de `main` y se integran en `main`. Solo defectos (`BUG-NNN`) pueden ir por esta ruta: ninguna funcionalidad entra a `main` sin pasar por `dev`.
- Su comprobación de reproducción entra a la regresión de `main` al cerrarlo, como la de cualquier elemento.

El **back-merge** lleva `main` a `dev`. MUST hacerse justo después de cada integración en `main` (hotfix o release):

- es un PR de `main` a `dev`, integrado con **merge commit**, para que `dev` tenga exactamente los mismos commits. No se usa *cherry-pick* ni un segundo PR con el mismo arreglo: crean commits distintos con el mismo cambio y conflictos en el release siguiente;
- si hay conflictos, se resuelven en ese PR, con la regresión de `dev` como evidencia;
- la comprobación de reproducción del hotfix llega a `dev` con el back-merge: si `dev` no tuviera el arreglo, su propia CI se pondría roja.

---

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

---

# 09 — Mejora continua del harness

## 1. Objetivo

Convertir los fallos observados de los agentes en controles permanentes, de modo que el mismo error no dependa de que alguien lo recuerde ni de que se repita una instrucción en cada sesión.

Anthropic recomienda construir skills **después** de evaluar: ejecutar el agente en tareas representativas, observar dónde falla y cerrar esas brechas de forma incremental. Simon Willison describe el mismo principio como el «paso compuesto»: cada proyecto termina con una retrospectiva que mejora las instrucciones de las ejecuciones siguientes. AES formaliza ambos.

## 2. Registro de fallos de agentes

Cada proyecto MUST mantener `docs/agent-failure-log.md` (plantilla en `templates/agent-failure-log.md`).

Se registra un fallo cuando un agente:

- implementa funcionalidad no pedida o sale de su superficie de cambio;
- intenta debilitar, omitir o modificar pruebas;
- afirma resultados que no ejecutó;
- entra en bucles de corrección o activa el circuit breaker (04 §9);
- inventa APIs, estructuras o requisitos;
- introduce complejidad, dependencias o abstracciones injustificadas;
- comete un error de convención del proyecto que se repite.

Cada entrada describe síntoma, cómo se detectó, causa probable y el control que se añadió. No se registran juicios sobre el modelo, sino hechos observables.

## 3. Retrospectiva compuesta

Al cerrar cada historia T2/T3 y cada lote de estabilización, y al menos una vez por cada grupo de trabajo T0/T1, el orquestador MUST:

1. revisar las entradas nuevas del registro;
2. identificar patrones (un fallo repetido dos veces es un patrón);
3. proponer **un control por patrón**, eligiendo el más duro que sea razonable, en este orden:
   1. prueba o chequeo en CI (L3);
   2. hook (L2);
   3. permiso del harness (L1);
   4. skill con un procedimiento específico;
   5. una línea en `AGENTS.md`/`CLAUDE.md`;
4. presentar la propuesta al responsable humano, que la aprueba o la rechaza (06 §8);
5. tras aplicarla, registrar en qué tarea posterior se verificó que el fallo no se repite.

Una línea en las instrucciones persistentes es el control más débil: el agente puede ignorarla o perderla al compactar contexto. Se usa cuando no hay forma razonable de automatizar la detección.

La retrospectiva es breve: patrones, un control por patrón y decisiones abiertas. El detalle ya está en el registro de hallazgos y en el de fallos; copiarlo a la retrospectiva duplica el costo de redacción del orquestador.

## 4. Evaluación de cambios al harness

Los cambios a instrucciones persistentes, skills, hooks o permisos SHOULD comprobarse con al menos una tarea representativa antes de darse por buenos. Una instrucción que no cambia el comportamiento observado se elimina: ocupa contexto sin aportar.

## 5. Higiene de las instrucciones persistentes

- Revisar periódicamente `AGENTS.md`/`CLAUDE.md` y eliminar entradas que ya cubre un control más duro.
- Mantener el archivo breve; si crece, mover procedimientos a skills y dejar solo el puntero.
- No acumular reglas contradictorias: una entrada nueva que contradice otra la sustituye explícitamente.

## 6. Evidencia del proceso y métricas

Además del registro de fallos, cada proyecto SHOULD mantener un **registro de hallazgos del proceso** (`docs/harness-findings.md`, plantilla en `templates/harness-findings.md`): fricciones, confirmaciones de que un control funcionó, huecos de control y costos. Es la materia prima de las retrospectivas y de las propuestas de cambio a AES.

Por cada elemento cerrado (historia, enabler, lote) se registra una fila de métricas:

| Elemento | Inicio | Fin | Modelo real por rol | Ciclos FAIL | Intervenciones humanas | Bloqueos de controles | Costo | Tiempo |
|---|---|---|---|---|---|---|---|---|

- **Modelo real por rol:** el que ejecutó, no el que declara el perfil (06 §11).
- **Intervenciones humanas:** cada vez que el humano decidió, aprobó, corrigió o desbloqueó algo.
- **Bloqueos de controles:** de hooks, permisos y clasificadores del harness, por separado. Un control que nunca bloquea puede estar funcionando o no estar probado; un control que bloquea mucho puede estar mal calibrado.
- **Costo:** el que reporta el harness. Si solo el humano puede consultarlo, el orquestador se lo pide al cerrar.

## 7. Notas durante el ciclo

- Los hallazgos, fallos y decisiones se anotan **en el momento**, con la hora real que da un comando, no con una hora escrita por el agente. En el sandbox de AES, el orquestador escribió horas estimadas, algunas por delante del reloj.
- Las notas en curso viven fuera del control de versiones (por ejemplo, `.aes/`) y se consolidan en los registros versionados en el cierre del elemento. Así no se cuelan en los PR de tareas, donde el guardián las rechazaría por estar fuera de la superficie.
- La creación y el vaciado de las notas los hace un script, no un rol: si un rol no puede escribir en esa carpeta, la consolidación no debe depender de que pueda.

---

# 10 — Principios de diseño y patrones

## 1. Objetivo

Que el código, sea pequeño o grande, se pueda entender, probar, depurar y hacer crecer sin reescribirlo, **sin** añadir estructura que nadie necesita todavía.

Decirle a un modelo «aplica SOLID» o «escribe código limpio» no le da información que no tuviera: añade ruido. Este capítulo convierte esos principios en reglas con un síntoma comprobable y una frontera explícita de cuándo no aplican, y asigna a alguien con criterio la decisión de qué patrón usar en cada caso.

## 2. Dos niveles

Un principio es de **nivel 1 (siempre obligatorio)** si cumple las tres condiciones:

1. **Aplicarlo hoy no cuesta casi nada:** no añade tipos, capas ni indirección; es una forma de escribir lo que se iba a escribir de todos modos.
2. **Aplicarlo después cuesta cada vez más:** introducirlo en código existente crece con el tamaño de ese código.
3. **Es local:** no obliga a diseñar otros módulos alrededor.

Lo que no cumple las tres es de **nivel 2 (condicional)**: se aplica solo cuando hay una **razón presente**, es decir, variantes reales en el código, historias del backlog que la piden o un ADR. «Por si acaso» no es una razón presente.

Los dos niveles se refuerzan: los principios del nivel 1 son los que hacen que añadir un patrón del nivel 2 más adelante sea un cambio local y no un refactor de todo el código. Por eso el nivel 2 puede esperar sin que esperar salga caro.

## 3. Nivel 1: principios siempre obligatorios

Aplican a todo código del proyecto, en cualquier lenguaje, también en scripts. Un incumplimiento es un hallazgo del verificador (de la tarea → ciclo `FAIL`). Las excepciones son excepciones documentadas (00 §4).

| Principio | Qué exige | Síntoma de incumplimiento |
|---|---|---|
| **Responsabilidad única** | Cada función y cada módulo hace una sola cosa. En un script: leer la entrada, procesar y escribir la salida son funciones distintas | Una unidad que cambia por dos motivos; un nombre con «y» o vago (`procesar`, `manejar`, `utils`) |
| **Lógica separada de la entrada/salida** | Las reglas del negocio reciben datos y devuelven datos; no leen archivos, no llaman a la red ni a la base de datos | Una regla que no se puede probar sin levantar la base de datos, el servidor o el sistema de archivos |
| **Dependencias recibidas, no creadas** | Lo que una pieza necesita lo recibe por parámetro o constructor; no lo crea por dentro ni lo toma de un global. No exige crear interfaces | Una regla de negocio que instancia un cliente HTTP, una conexión o un reloj, o que lee un global |
| **Acceso a datos agrupado por funcionalidad** | Las consultas y escrituras de una funcionalidad viven juntas, en un solo lugar | La misma consulta, o una casi igual, repartida en varios archivos |
| **Contratos explícitos en las fronteras** | Lo que se expone (API, CLI, eventos) tiene tipos propios, distintos de los internos | Cambiar una columna o un tipo interno cambia la respuesta pública |
| **Errores explícitos** | Se falla pronto, con un mensaje que dice qué y dónde; ningún error se silencia | `catch` vacío; devolver `null`, `-1` o una cadena vacía para indicar un error |
| **Sustitución (Liskov)** | Si se usa herencia, una subclase funciona donde se espera su base. La opción por defecto es la composición | Una subclase que lanza «no soportado», ignora o debilita un método de su base |
| **Interfaces pequeñas** | Cuando se crea una interfaz (por una razón del nivel 2), contiene solo lo que usan sus clientes. No es una razón para crear interfaces | Una implementación con métodos vacíos o que lanzan «no implementado» |
| **Visibilidad mínima** | Todo es privado salvo lo que otra pieza necesita usar | Miembros públicos que solo se usan dentro de su propio módulo |
| **Configuración fuera del código** | Direcciones, rutas, credenciales y valores que cambian por entorno salen del entorno o de la configuración | Un valor de un entorno concreto escrito en el código |
| **Validar en la frontera y convertir** («parse, don't validate») | Lo que entra (petición, archivo, argumento) se valida una vez, en la frontera, y se convierte a un tipo que ya no puede ser inválido; el interior trabaja con ese tipo | La misma validación repetida dentro del sistema; funciones internas que vuelven a comprobar si un valor es nulo, vacío o tiene el formato correcto |
| **Sin código provisional** | Un corte mínimo se escribe con la estructura que va a tener: cada pieza en el archivo y el módulo que le corresponden desde el primer commit, aunque eso signifique cuatro archivos de dos líneas en lugar de uno de seis. «Después lo refactorizamos» no es un plan | Un archivo que acumula piezas de responsabilidades distintas para que funcione rápido (todo en `App.tsx`, toda la API en `Program.cs`); lógica dentro de componentes de interfaz o de endpoints; comentarios como «temporal», «por ahora», «TODO: mover» |
| **Comprobaciones estrictas del compilador** | El modo estricto del lenguaje está activado (por ejemplo, `strict` en TypeScript, *nullable reference types* y advertencias como errores en C#, `set -euo pipefail` en bash) | Valores que pueden ser nulos sin que el tipo lo diga; advertencias del compilador ignoradas |

Lo que un linter del stack pueda detectar (complejidad y largo máximos por función y por archivo, un componente por archivo, `catch` vacíos, variables globales, ShellCheck en scripts) SHOULD ir a la CI (L3): así deja de depender de que alguien lo recuerde. El perfil lista qué reglas del nivel 1 cubre su CI. Los marcadores de trabajo pendiente (`TODO`, `FIXME`, `HACK`) añadidos por un agente se tratan como marcadores del guardián (05 §10): exigen aprobación humana o un elemento del backlog que los resuelva.

Los modelos tienden al camino más corto que hace funcionar algo, y ese camino no suele ser el que evita retrabajo. Por eso esta regla no se deja a criterio del agente: la nota de diseño dice en qué archivo va cada pieza, y juntarlas es un hallazgo de la tarea (ciclo `FAIL`).

## 4. Nivel 2: principios y patrones condicionales

| Principio o patrón | Cuándo sí | Cuándo no |
|---|---|---|
| **Abierto/cerrado** | La variación ya existe: hay dos o más variantes reales, o están en el backlog | Para «facilitar extensiones futuras» que nadie pidió |
| **DRY (no repetirse)** | A la **tercera** repetición del mismo conocimiento, no del mismo texto | Dos fragmentos que se parecen pero cambian por motivos distintos: unificarlos crea la abstracción equivocada |
| **Interfaz o abstracción** | Hay dos implementaciones, o las pruebas necesitan sustituir la dependencia y el lenguaje no permite hacerlo sin una interfaz | Una sola implementación sin otra a la vista |
| **Repository** | Varias fuentes de datos para el mismo agregado, consultas complejas que se repiten entre funcionalidades, o un ADR que lo pide | Encima de un ORM que ya es un repositorio, con una sola fuente y consultas simples |
| **Strategy** | Varias formas de hacer lo mismo elegidas en tiempo de ejecución, ya presentes o en el backlog | Una sola forma, o dos que no cambian |
| **Observer / eventos** | Varios consumidores independientes de un mismo hecho, o desacoplar módulos que de otro modo se llamarían en cadena | Un solo consumidor conocido: una llamada directa es más clara y más fácil de depurar |
| **Factory** | La creación tiene lógica real (elegir tipo, validar, ensamblar varias piezas) | Un `new` con parámetros |
| **Mediator, CQRS, bus de comandos** | Un ADR que lo justifica por escala, auditoría o separación de modelos de lectura y escritura | Un CRUD |
| **Genéricos y plugins** | Tres casos concretos que comparten la forma | El primer caso |
| **Tipos propios para conceptos del dominio** (*value objects*: un monto, un correo, un periodo) | El concepto tiene reglas propias (rango, formato, redondeo) que hoy se comprueban en más de un lugar, o un error de unidades ya costó un defecto | Un valor sin reglas, que solo se transporta |
| **Estados imposibles irrepresentables** (uniones discriminadas, máquinas de estado tipadas) | Un objeto con campos que solo tienen sentido en ciertos estados, y combinaciones inválidas que ya aparecieron | Dos o tres estados simples que un enumerado expresa bien |

La tabla no es exhaustiva. Todo patrón del nivel 2 se decide con la misma pregunta: **¿qué razón presente lo justifica, y qué costaría añadirlo más adelante si se respeta el nivel 1?** Si la respuesta a la segunda es «poco», se espera.

## 5. Nota de diseño

El **orquestador** decide el nivel 2 y actúa como diseñador senior del equipo. Por eso MUST correr en el modelo más capaz disponible (06 §11): elegir un patrón, y sobre todo decidir no usarlo, es razonamiento, no redacción.

**Cuándo:**
- en cada historia o enabler T2/T3, al dividir en tareas y antes de `Ready`: una nota de diseño por tarea;
- a demanda: si el programador tiene una duda de diseño a mitad de una tarea, termina con `BLOCKED` y la pregunta; el orquestador responde con una nota nueva o una enmienda.

**Con qué decide:** con hechos, no con el relato de otro agente (00 §7):
- la historia, sus criterios y el contrato de interfaz;
- los ADR y el **catálogo de diseño** del proyecto (§6);
- un **resumen estructural** generado por una herramienta: los archivos y las firmas públicas, sin el código de las implementaciones; o, si el proyecto lo usa, un grafo de código generado por análisis sintáctico, del que solo cuentan como hechos las relaciones extraídas del código, no las inferidas;
- la pregunta del programador, si la hay.

**Qué produce** (plantilla `templates/design-note.md`):
- qué piezas crear o cambiar, dónde y con qué responsabilidad cada una;
- qué patrón del nivel 2 se usa, con su razón presente;
- **qué no se hace**, de forma explícita («no se crea interfaz para X: hay una sola implementación»), con el mismo peso que lo que sí;
- cómo se aplica el nivel 1 donde no es obvio (por ejemplo, dónde termina la lógica y empieza la entrada/salida).

La nota va en la especificación de la tarea y la aprueba el responsable humano con el resto del PR de pruebas y tareas. Una decisión que vale para más de una historia sube a un ADR (01 §4).

## 6. Catálogo de diseño del proyecto

Cada proyecto mantiene `docs/design-catalog.md` (plantilla `templates/design-catalog.md`): qué patrones del nivel 2 usa, dónde, por qué y qué se decidió no usar. Es la memoria de diseño del proyecto: sin él, cada nota de diseño vuelve a decidir lo mismo, o decide distinto.

El orquestador lo actualiza en el cierre de cada elemento con lo que las notas de diseño introdujeron.

## 7. Verificación

- La nota de diseño es parte del contrato de la tarea: el verificador revisa el diff contra ella igual que contra la superficie de cambio. Un patrón que la nota no autoriza o una pieza con otra responsabilidad que la asignada es un hallazgo.
- El verificador revisa el diff contra los síntomas del nivel 1 (§3).
- Lo que detecta un linter en la CI no hace falta revisarlo a mano; lo que no, sí.
