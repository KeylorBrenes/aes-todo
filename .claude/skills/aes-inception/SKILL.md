---
name: aes-inception
description: Incepción de AES (standard/01 §2). El orquestador entrevista al responsable del producto por temas, con bloques cortos de preguntas concretas, hasta que la idea es clara, y produce el brief, el backlog completo pero superficial con Epics y releases, la arquitectura inicial, el ADR del stack, la dirección visual si hay interfaz y EN-001 (esqueleto que camina), en un único PR. Úsala cuando el proyecto no tiene docs/backlog.md, o para una mini-incepción cuando llega una idea que no cabe en el backlog.
---

# Incepción (AES 01 §2)

Eres el orquestador. Tu trabajo aquí es **entender antes de planificar**: el responsable del producto describe la idea en lenguaje natural y tú haces las preguntas que la vuelven planificable. No escribes código, criterios detallados ni tareas: eso llega cuando le toca a cada historia (AES 02 §7).

Corre en el modelo más capaz disponible (AES 06 §11). Si no es así, díselo al humano antes de empezar.

## 0. Arranque

1. ¿Hay `docs/backlog.md`? Si existe y la idea nueva cabe en un Epic que ya está, **no es una incepción**: se añade la historia al backlog. Si es un Epic nuevo o cambia usuarios o alcance, es una **mini-incepción**: solo los bloques afectados (sección 5).
2. ¿Hay código? Si el repositorio ya tiene una aplicación, inspecciónalo primero (estructura, stack, qué hace) y empieza la entrevista por lo que el código no dice (AES 01 §2.5).
3. Rama: `spec/inception` desde `dev` (mini-incepción: `spec/inception-<n>`). Todo lo que produces va en esa rama y en **un solo PR**.
4. Pídele al humano la idea en sus palabras, si no la dio ya. No la interrumpas con preguntas hasta tenerla completa.

## 1. La entrevista

Pregunta **por temas, un bloque a la vez**, en este orden (salta los que la idea ya responde):

| Bloque | Qué tiene que quedar claro |
|---|---|
| A. Problema y usuarios | Quién lo usa, qué hace hoy sin el producto, qué le duele |
| B. Lo que el usuario hace | Las acciones principales, de principio a fin: serán los Epics |
| C. Datos y reglas | Qué se guarda, qué lo limita, qué pasa en los casos raros |
| D. Restricciones | Privacidad, cuentas y acceso, dispositivos, idioma, plazos, integraciones |
| E. Stack y operación | Preferencias o restricciones tecnológicas, dónde corre, quién lo mantiene |
| F. Primer release | Qué es lo mínimo que ya sirve, qué puede esperar |
| G. Interfaz (si la hay) | Tono de los textos, accesibilidad, marca y recursos que ya existen, restricciones visuales que no se discuten. Nada de colores ni estilos: eso es la dirección visual (sección 4.1) |

### Cómo es un bloque

- **2 a 5 preguntas, un solo tema.** Nunca la entrevista entera de una vez.
- **Cada pregunta se responde en una o dos frases.** Si hay opciones razonables, propónlas con tu recomendación y su porqué en una línea; el humano elige o corrige. Si tu harness tiene una herramienta de preguntas con opciones, úsala para estas.
- **Comportamiento, no tecnología** (salvo el bloque E).
- **Parte de lo que ya se dijo.** Cita la respuesta anterior cuando la pregunta depende de ella.

Pregunta mal formulada → bien formulada:

| No | Sí |
|---|---|
| ¿Qué funcionalidades quieres? | Dijiste que anotas tareas para no olvidarlas. ¿Una tarea necesita fecha límite, o basta con el texto? Recomiendo empezar sin fecha y añadirla en el segundo release. |
| ¿Cómo manejamos los usuarios? | ¿La app la usa una sola persona en su equipo, o cada persona tiene su cuenta? Si es una sola, no hace falta inicio de sesión en el primer release. |
| ¿Qué base de datos prefieres? (en el bloque C) | Cuando se borra una tarea, ¿desaparece del todo o se puede recuperar? |
| ¿Algo más? | Te faltan los casos raros de editar: ¿se puede dejar una tarea sin texto? Recomiendo que no. |

### Después de cada bloque

Resume en 3–4 líneas lo que entendiste, con las decisiones en negrita, y pregunta solo si algo está mal. Lo que el humano no sabe **no lo inventes**: anótalo como «por definir» (supuesto o incertidumbre, con cómo y cuándo se resuelve) o propón un Spike.

## 2. Cuándo parar (AES 01 §2.2)

Para cuando se cumplen las cuatro:

1. cada acción principal tiene historias con título en formato, una línea de valor, `Requiere:` y puntos aproximados;
2. el primer release está delimitado: qué historias y qué resultado observable da;
3. hay datos para elegir stack y describir el esqueleto que camina;
4. lo que falta está nombrado («por definir» o Spike), con quién y cuándo.

No sigas preguntando para detallar historias lejanas: ese detalle se pregunta en su refinamiento.

## 3. El backlog

1. **Epics** = las acciones del bloque B. **Historias** = cortes verticales y atómicos de cada Epic (AES 02 §3.1–3.2), en formato «Como [usuario], quiero [capacidad], para [beneficio]». Aplica el control de atomicidad ya: un «y» en el «quiero» o 8 puntos o más se dividen ahora (formas de AES 02 §10).
2. **EN-001 primero:** «Para que las historias se puedan probar de punta a punta, necesitamos …». Su criterio es un comando o un caso mínimo de punta a punta, con la CI en verde.
3. **Releases** (AES 02 §12): REL-001 es lo mínimo que ya sirve (EN-001 y las historias del bloque F); los siguientes, lo que se sabe que viene. Un objetivo de una frase por release.
4. Escríbelo en `docs/backlog.md` con la plantilla de AES (`templates/backlog.md`): secciones Releases, Elementos (columnas `Epic` y `Release` incluidas) y Epics. Todo en `Draft`.
5. Muéstrale al humano el mapa como lista: Epic → historias, con el release de cada una. Es donde más se corrige.

## 4. Arquitectura, stack y perfil

1. **ADR del stack** (`docs/adr/ADR-001-stack.md`, plantilla `templates/adr.md`): dos o tres opciones que encajan con el bloque E, ventajas y costes de cada una, y tu recomendación. El humano decide. No elijas lo que conoces mejor: elige lo que pide el proyecto y lo que el humano puede mantener.
2. **Architecture Overview** (`docs/architecture.md`, plantilla `templates/architecture-overview.md`): solo lo que necesitan EN-001 y las primeras historias (AES 01 §3, §6).
3. **Diagrama de componentes**, como vista del texto (el texto es la fuente):
   - si el perfil registra **archify** (skill de terceros, AES 06 §6.2), escribe la especificación en `docs/diagrams/architecture.json` (eso es lo que se versiona y se revisa) y genera el HTML en `.aes/diagrams/architecture.html` con `validate` y después `deliver` (tipo `architecture`, `--quality showcase`). El HTML no se versiona: pesa cientos de KB y se regenera desde el JSON, como el tablero. Omite su paso de avisos de actualización (en la implementación de referencia, `ARCHIFY_UPDATE_CHECK_DISABLED=1`). Si el contenido está en español, omite `meta.locale`: los controles del visor quedan en inglés;
   - si no, un bloque Mermaid dentro de `docs/architecture.md`.
4. **Project Profile** (`docs/project-profile.md`, plantilla `templates/project-profile.template.md`): stack, comandos (aunque todavía no funcionen: EN-001 los hará funcionar), convenciones, skills y herramientas registradas.
5. **Brief** (`docs/project-brief.md`, plantilla `templates/project-brief.md`), con los releases previstos y la tabla de «por definir».
6. Si no existe, la copia local de DoR/DoD en `docs/aes/` (el instalador de AES la deja ahí).
7. **Interfaz**, si el proyecto la tiene (sección 4.1).
8. **Entorno de la máquina**, en cuanto el humano elige el stack: añade a `AES_DOCTOR_CHECKS` de `.claude/aes.env` las comprobaciones de su toolchain, con una **compilación mínima** por lenguaje compilado (`probe:rust`, `probe:dotnet`; sin ella no se detecta un compilador sin enlazador o sin SDK) y lo que necesite la aceptación (navegadores de Playwright). Ejecuta `bash .claude/scripts/aes-doctor.sh` y, si falla algo, dale al humano **en un solo mensaje** todo lo que tiene que instalar, con el comando o el enlace de cada cosa para su sistema operativo. EN-001 no empieza con el entorno en rojo. El cambio a `aes.env` va en el PR de incepción.

### 4.1 Interfaz: contexto de producto y dirección visual

Si el perfil registra **impeccable** (skill de terceros, AES 06 §6.2), la usas tú aquí; si no, describes la dirección visual en `docs/architecture.md` y le pides al humano que elija entre dos o tres opciones con muestras.

1. **Contexto de producto, sin segunda entrevista.** Impeccable tiene su propia entrevista (`init`, y `shape` por pantalla) con preguntas que la tuya ya respondió: usuarios, propósito, situaciones, restricciones, stack. Ejecuta `impeccable context` y después `init` **con el brief y las respuestas de los bloques A–G como fuente**: escribe `PRODUCT.md` a partir de ellos, marca como inferido lo que dedujiste y no te dijeron, y preséntaselo al humano en **una sola ronda de confirmación**, preguntando solo lo que de verdad falte (máximo tres preguntas, con las reglas de la sección 1). No contestes tú las preguntas de impeccable sin enseñárselas: un hecho inferido sin confirmar es un supuesto, y los supuestos van al brief como «por definir».
2. **La dirección visual la elige el humano.** Sigue el flujo de obra nueva de impeccable: te propondrá direcciones en una página para elegir. Esa página consulta el catálogo de impeccable (registrado en el perfil; no envía código ni archivos) y arranca un servidor local: ábrela solo con el humano presente y, cuando conteste, detén el servidor (`serve-question --stop --key <clave>`). El humano elige; tú no eliges por él a partir de lo que contestó.
3. Con la dirección elegida, `DESIGN.md` (el sistema visual) entra en el PR de incepción. No lo confundas con `docs/design-catalog.md`, que es el diseño del código (AES 10).
4. `PRODUCT.md` no sustituye al brief: si algo cambia, se cambia primero en el brief y después en `PRODUCT.md`.
5. Comprueba que `.impeccable/config.json` tiene la telemetría, el aviso de actualizaciones y el hook desactivados (el instalador de AES lo deja así).

## 5. Mini-incepción

Para una idea que no cabe en el backlog: solo los bloques que cambian (normalmente B, C y F; E solo si la idea toca el stack). Mismas reglas de preguntas. El PR actualiza brief, backlog y, si cambia, arquitectura; no reescribe lo que no cambió.

## 6. El PR de incepción

1. Un commit `docs:` por documento o uno solo, sin código.
2. Abre el PR a `dev`. En la descripción: visión en una frase, Epics, releases con sus historias, stack recomendado, dirección visual elegida (si hay interfaz), «por definir» abiertos y lo que necesita la aprobación del humano.
3. Regenera el tablero (en la implementación de referencia, `node .claude/scripts/aes-board.mjs`) y, si hay, el diagrama; dile al humano qué archivos abrir.
4. Hasta que el humano aprueba el PR, nada es un compromiso. Después, cualquier cambio del backlog entra por PR.
5. El siguiente paso es EN-001, con el ciclo normal (en la implementación de referencia, la skill `aes-cycle`).

## Lo que no haces

- Criterios Dado/Cuando/Entonces, notas de diseño o tareas: son del refinamiento de cada historia.
- Preguntas abiertas o en bloque gigante.
- Elegir el stack o la dirección visual sin que el humano decida.
- Dejar vivo el servidor de una página de decisión.
- Inventar lo que el humano no sabe.

## Ejemplo

`examples/architecture.todo.json`: especificación de archify para el esqueleto que camina de una app de tareas (usuario → web → API → base de datos). Validada y entregada con archify 2.16.
