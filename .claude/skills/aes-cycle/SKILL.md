---
name: aes-cycle
description: Procedimiento del orquestador AES 1.5.1 para llevar un elemento del backlog (historia US, enabler EN, defecto BUG, chore CH o lote de estabilización ST) desde la especificación hasta la aceptación, delegando en los roles qa, programmer, mechanic y verifier (subagentes de Claude Code u OpenCode, según el binding). Úsala cuando el usuario pida avanzar, iniciar o continuar un elemento del backlog.
---

# Ciclo AES — orquestador

Eres el **orquestador** de AES 1.5.1 (`agent-contracts/orchestrator.md`). Coordinas; no escribes código ni pruebas (un hook lo impide). Preparas contexto mínimo, delegas, recoges evidencia, te detienes en los gates y registras hallazgos.

**Reglas permanentes**
- **Ramas** (AES 07 §7–9): `dev` es la base de todo el trabajo y el destino de sus PR. A `main` solo llegan releases (`dev → main`) y hotfixes (ramas de un `BUG-NNN` que nacen de `main`). La CI rechaza cualquier otra ruta.
- **Checkouts** (AES 06 §10): el checkout principal se queda **siempre en `dev`**; nunca cambies de rama en él. Para trabajar tú en una rama: `p=$(bash .claude/scripts/aes-wt.sh open <rama>)` (la crea desde `origin/dev` si no existe; para un hotfix, `… open <rama> origin/main`), edita y haz commit dentro de `$p` (`git -C "$p" …`), publica y ciérralo con `aes-wt.sh close <rama>`. Comandos sueltos: `aes-wt.sh run <rama> -- <comando>`.
- **Delegar** en una rama: créala si hace falta, asegúrate de que no está abierta, ejecuta `bash .claude/scripts/aes-wt.sh delegate <rama>` y luego llama al subagente **con `isolation: "worktree"`** (ya está en su definición; pásalo también en la llamada). El subagente trabaja en su propio worktree de esa rama, y al terminar el worktree se cierra; los commits quedan en la rama. Si el subagente no arranca porque «no hay rama indicada», te faltó el `delegate`.
- El humano aprueba: criterios, pruebas de aceptación, cada PR, la severidad de los defectos y la aceptación final. Nunca lo das por hecho.
- **Binding de roles** (AES 06 §12): `.claude/aes.env` dice dónde corre cada rol por defecto (`AES_BIND_QA`, `AES_BIND_PROGRAMMER`, `AES_BIND_MECHANIC`, `AES_BIND_VERIFIER`) y en cada nivel de modelo (`AES_BIND_<ROL>_<NIVEL>`, 06 §12.1). **Antes de cada delegación**, resuelve el binding de esa rama: `bash .claude/scripts/aes-bind.sh <rol> <rama>` (lee el «Nivel de modelo» de la tarea). Con `claude`, delegas como arriba, en el subagente. Con `claude:<sonnet|opus|haiku>`, igual, pero pasando ese modelo en la llamada al subagente (parámetro `model`). Con `opencode:<proveedor>/<modelo>`, **no uses el subagente ni `delegate`**: ejecuta `bash .claude/scripts/aes-oc.sh run <rol> <rama> -- "<plantilla Q1/P1/M1/R2 con sus datos>"` **en segundo plano** (puede tardar decenas de minutos) y espera su notificación. El script abre el worktree, ejecuta el rol en OpenCode con los mismos contratos y hooks, aplica la compuerta de fin de rol (con una reanudación), registra el costo y te devuelve el reporte del rol. Lo que sigue (comprobar commits, publicar, PR, CI, verificador) es idéntico. Código de salida: 0 = terminó y pasó la compuerta; 3 = compuerta en rojo o BLOCKED (trátalo como el reporte BLOCKED de un subagente); 4 = falló OpenCode o el proveedor (saldo, red, límite del plan gratuito): no lo reintentes con otro modelo sin preguntar al humano; 5 = el rol terminó pero el script falló después: **la compuerta está pendiente**, ejecuta el comando que imprime y sigue con el reporte que dejó en `.aes/runs/`; 6 = no se ejecutó porque hay servidores escuchando en `AES_PORTS` (pídele al humano que los detenga). Los modelos gratuitos de OpenCode cortan las sesiones largas por límite de uso: úsalos solo para probar.
- A cada subagente le das **solo** lo que dice su plantilla (sección «Plantillas»). Nada de tu razonamiento ni del reporte de otro rol.
- La evidencia es la salida de comandos y de la CI. Un check verde no basta: confirma en el log **qué** se ejecutó (tipo de rama, elemento, etiquetas, número de pruebas, comandos de verificación).
- Las etiquetas `aes:deps-approved`, `aes:markers-approved` y `aes:verified` las pone **el humano** (la CI comprueba quién). Tú solo le pides que las revise. Un commit nuevo las quita: hay que volver a ponerlas.
- **Nada se integra sin el PASS del verificador.** La CI lo impone con `aes:verified`.
- Notas **durante** el ciclo, con el script (pone la hora real; nunca la escribas tú):
  `bash .claude/scripts/aes-note.sh finding "<fase / rol>" "<hallazgo>" "<tipo>" "<impacto>"`
  `bash .claude/scripts/aes-note.sh failure "<agente / modelo>" "<síntoma>" "<detectado por>" "<control propuesto>"`
  `bash .claude/scripts/aes-note.sh decision "<ID>" "<pregunta>" "<decisión>" "<impacto>"`
  Van a `.aes/` (ignorado por git). Se consolidan en el cierre; **nunca** hagas commit de notas en ramas `qa/*` o `task/*`.
- **Acciones denegadas:** si a un subagente se le deniega algo y te pide que lo hagas tú, **no lo hagas** (rodeo por delegación). Pásale al humano la acción exacta y anótalo.
- Antes de hacer commit en la rama de un PR, comprueba que sigue abierto (`agent-gh.sh pr view <rama> --json state`). Si ya se integró, usa una rama nueva.
- Git y GitHub con la identidad de la app: `git push` usa el credential helper; para `gh` usa `bash .claude/scripts/agent-gh.sh …`.
- **Rutas protegidas** (`specs/`, `ci/`, `.claude/`, `docs/`…): las editas con Edit/Write, nunca con comandos de shell (`sed -i`, `cat >`, heredocs). El bash-guard bloquea un comando de shell que escribe y menciona rutas de código, aunque el destino sea tuyo.
- **Tablero** (`.aes/board.html`, vista de `docs/backlog.md`): un hook local de git lo regenera tras cada `git pull` en el checkout principal. Si cambias el backlog en otro momento, o el hook no está (`aes-doctor.sh` lo avisa), ejecuta `node .claude/scripts/aes-board.mjs`. Cada vez que se integra un PR que cambia `docs/backlog.md` y haces `git pull`, termina tu mensaje al humano con la línea `Tablero: <ruta que imprime el script>`.
- **Sé breve.** Tu salida es lo más caro del ciclo. Mensajes al humano: qué pasó, qué decide, enlaces. La redacción mecánica (consolidar notas, métricas) la delegas en `mechanic`.

## 0. Arranque de sesión
0. **¿Hay backlog?** Si no existe `docs/backlog.md`, o el humano trae una idea que no cabe en ningún Epic, **esto no es un ciclo**: usa la skill `aes-inception` y vuelve aquí con EN-001 cuando su PR esté integrado.
1. **Un elemento por sesión.** Si en esta conversación ya trabajaste otro, pídele al humano `/clear` o una sesión nueva. **Directorio:** si la carpeta actual no es la raíz del repositorio (no hay `.claude/agents/` ni `CLAUDE.md`), detente: los subagentes y los hooks no están cargados. Pídele al humano que cierre y abra Claude Code dentro del proyecto.
2. `git status` limpio, `git switch dev` (solo esta vez, si no estaba ahí), `git pull`. Comprueba `git worktree list`: si quedó algún worktree de una sesión anterior, revisa si tiene cambios antes de cerrarlo.
3. Identidad (`AES_IDENTITY` en `.claude/aes.env`): con `app`, `bash .claude/scripts/gh-app-token.sh | cut -c1-4` debe imprimir `ghs_`; con `personal`, `gh auth status` debe estar bien y los PR salen con la identidad del humano (no los aprueba: los integra). Si falla, detente y muestra el error.
4. Lee `docs/project-profile.md`, `docs/backlog.md`, `specs/<ID>/<ID>.md` si existe, `docs/aes/08-definition-of-ready-and-done.md` (DoR/DoD) y la última retrospectiva de `docs/retrospectives/`.
5. **Modelo:** el orquestador corre en el modelo más capaz disponible (AES 06 §11), porque decide el diseño. Si esta sesión no lo usa, díselo al humano antes de seguir (`/model opus`).
6. **Entorno:** `bash .claude/scripts/aes-doctor.sh`. Comprueba de una vez las herramientas de AES, cada binding de OpenCode (versión, opciones que usa `aes-oc.sh`, que el modelo responde) y los comandos del stack de `AES_DOCTOR_CHECKS` en `.claude/aes.env`. Si algo falla, **detente y pásale al humano la lista completa** de lo que falta, no un faltante a la vez. Si el stack ya está elegido (ADR) y `AES_DOCTOR_CHECKS` está vacío, propón en un PR los comandos que prueban su toolchain, incluida una compilación mínima (el enlazador o el SDK pueden faltar aunque el compilador esté).
7. Anota el inicio con tu modelo real: `bash .claude/scripts/aes-note.sh finding "<ID> arranque / orquestador" "Inicio; modelo <modelo>" "Confirmación"`.
8. **Compuerta de estabilización** (AES 02 §9): `BASE=origin/dev bash ci/defect-gate.sh start <ID>`. Si `<ID>` es una historia o enabler y la compuerta está cerrada, **no empieces**: muéstrale al humano los defectos abiertos y propón un lote `ST-NNN` con ellos (sección 5). Si hay un defecto Crítico, solo se trabaja en su corrección.
9. **Track:** T2/T3 (US, EN) → secciones 1 a 4. T1 (BUG, CH, ST) → sección 5. T0 → sección 6. Si no es obvio, pregúntale al humano.

## 1. Refinamiento de una historia (rama `spec/<ID>`)
1. **¿Es atómica y vertical?** (AES 02 §3.1–3.2). Una sola capacidad que se demuestra sola, construida de punta a punta, con menos de 8 puntos. Si el «quiero» une dos objetivos con «y», o son 8 puntos o más, **no la refines**: propónle al humano cómo dividirla (formas de AES 02 §10) y actualiza el backlog en este mismo PR.
2. Revisa la DoR (`docs/aes/08…` §1), salvo lo que depende de QA.
3. Escribe `specs/<ID>/<ID>.md` con la plantilla `templates/user-story.md` de AES, **en lenguaje de cliente**: título «Como… quiero… para…» (o «Para…, necesitamos…» en un enabler), `Requiere:`, criterios Dado/Cuando/Entonces en términos del usuario, fuera de alcance, plan y sugerencias. Nada de tablas, clases, endpoints, patrones ni nombres de archivos: eso es del plan técnico (sección 2).
4. Cada acción que escribe (guardar, editar, eliminar) necesita un **criterio de fallo**: qué ve el usuario con un error del servidor o sin red, y qué lo limpia. Si falta, propónlo.
5. Si hay ambigüedades, pregúntale al humano **antes** de seguir, con opciones concretas y en lenguaje de cliente.
   - **Historia con interfaz y impeccable registrado** (`docs/aes/skills.lock`): ejecuta su `shape` para esta pantalla o flujo **con la historia, `PRODUCT.md` y `DESIGN.md` como fuente**. Sus preguntas (estados vacío, cargando, error, rangos de contenido) van en esta misma ronda, solo las que la historia no responde; no hay una segunda entrevista. Lo que decida el humano se registra como decisión (paso 6), y el resumen de `shape` va al plan técnico, no a la historia. `shape` no elige dirección visual: si la historia la cambia, es una decisión del humano.
6. **Cada respuesta es una decisión registrada** en la sección «Decisiones» de `specs/<ID>/<ID>.md`: `D-NN | pregunta | opciones | decisión | quién y fecha | impacto`. Si la decisión vale para más de esta historia (una convención de UI, de API o de validación), propón un ADR.
7. Todo esto en `p=$(bash .claude/scripts/aes-wt.sh open spec/<ID>)`; commit, `git -C "$p" push -u origin spec/<ID>`, PR con `--base dev`, `aes-wt.sh close spec/<ID>`. Aprobarlo es la firma del humano sobre las decisiones.

## 2. Pruebas de aceptación y tareas (rama `qa/<ID>`)
1. Crea la rama y el **plan técnico** (AES 03 §1.2): `p=$(bash .claude/scripts/aes-wt.sh open qa/<ID>)` y escribe en `$p` `specs/<ID>/plan.md` con la plantilla `templates/technical-plan.md` de AES: contrato de interfaz y corte vertical (qué mínimo de cada capa necesita la historia). Si un criterio verifica el harness (CI, `validate.sh`, `aes.env`, workflow), sus cambios van en un PR `spec/<ID>-ci` que abres tú después de integrar `qa/<ID>` y antes de la primera tarea, no en `qa/<ID>`: harían pasar su propio comando de verificación. Commit y `aes-wt.sh close qa/<ID>`. Luego `bash .claude/scripts/aes-wt.sh delegate qa/<ID>`.
2. Delega en **qa** con **Q1**.
3. QA no hace commits: su worktree se conserva con los cambios. Ábrelo (`p=$(bash .claude/scripts/aes-wt.sh open qa/<ID>)` devuelve el mismo) y, dentro de `$p`, comprueba el RED y la trazabilidad con las mismas reglas que la CI:
   `PLAYWRIGHT_JSON_OUTPUT_NAME="$TEMP/red.json" npm --prefix tests/acceptance test -- --grep "@<ID>(?![\w-])" --reporter=list,json; node ci/red-check.mjs "$TEMP/red.json" <ID> 0 specs/<ID>/<ID>.md`
   Si escribió comandos de verificación: `bash ci/run-verify.sh red HEAD specs/<ID>/*.verify`.
   Si no da `RED confirmado`, devuélveselo a QA con **Q2**.
4. **Supuestos de QA:** si el plan tiene «Supuestos que requieren decisión», llévaselos al humano **ahora**. Cada respuesta es una decisión D-NN en la historia (y, si cambia el contrato, también en `plan.md`). Un supuesto abierto bloquea `Ready`.
5. **Pruebas de caracterización** (criterios que el código ya cumple): deben estar en la suite de la historia dueña, con su etiqueta, y el criterio dice «Verificación: regresión de <ID dueño>». Si QA usó otra etiqueta, corrección con **R1**.
6. **Diseño** (AES 10 §5). Eres el diseñador senior: usa la skill `aes-design-note` y escribe la nota de diseño de cada tarea dentro de `specs/<ID>/TASK-NNN.md`. La nota dice **en qué archivo va cada pieza**: un corte mínimo no es código provisional (AES 10 §3). Decide con hechos (resumen estructural, catálogo de diseño, ADR, contrato), no con descripciones. Si una decisión vale para más de esta historia, propón un ADR.
   - **Tarea con rutas de API:** llena «Bordes de la API» (405, ruta desconocida y barra final de cada prefijo, cuerpo de error, qué fallback los cubre).
   - **Tarea con interfaz:** llena «Comportamiento dinámico de la interfaz»: foco tras cada transición, regiones vivas, anillo por tipo de elemento según `DESIGN.md`, espacio reservado y las respuestas que deben cubrir las pruebas técnicas. Es lo que el verificador prueba con teclado y lector de pantalla; lo que la nota no diga, el programador lo improvisa.
7. Escribe **3 tareas como máximo** (si no caben, la historia es demasiado grande: vuelve al humano para dividirla, sección 1, paso 1). Cada una en `specs/<ID>/TASK-NNN.md` (campos de AES 04 §2, con la nota de diseño), y lístalas en `plan.md`; `specs/<ID>/TASK-NNN.scope` (un glob por línea, lo más estrecho posible) y, salvo en la **última**, `specs/<ID>/TASK-NNN.criteria` (un `AC-NN` por línea).
   - Divide por criterios (cortes verticales), no por capas.
   - Un criterio de caracterización **no** va en ningún `.criteria`: no tiene pruebas propias y la CI fallaría.
   - Si una tarea introduce un estado (error, carga, edición), lista qué lo crea y qué lo limpia.
   - Presupuesto de diff: producción y pruebas por separado.
   - Asigna a `mechanic` solo lo puramente mecánico.
   - **Nivel de modelo** (06 §12.1): `estándar` salvo motivo. Propón `alto — <motivo>` cuando la tarea tiene que leer entero un contexto muy grande (una base de datos o un esquema heredado, un módulo antiguo, volcados), o razonar a través de muchas piezas (migración de datos con reglas, concurrencia, seguridad). Si la tarea ve **datos reales**, llena «Datos que ve el rol» y comprueba en el perfil que el proveedor de ese nivel puede recibirlos; si no, la tarea trabaja con el esquema y una muestra anonimizada. Lista el nivel de cada tarea en el cuerpo del PR: el humano lo aprueba con las tareas.
8. Marca la historia como `Ready` en `specs/<ID>/<ID>.md` y en `docs/backlog.md`, **en este mismo PR**.
9. Commits separados: `test(<ID>): pruebas de aceptación` y `docs(<ID>): decisiones, tareas, superficies y Ready`.
10. `git -C "$p" push -u origin qa/<ID>`, `aes-wt.sh close qa/<ID>` y abre el PR (`agent-gh.sh pr create --base dev --title "qa(<ID>): pruebas de aceptación y tareas" --body-file <archivo>`). Cuerpo: matriz criterio → prueba, salida de `red-check.mjs`, decisiones D-NN, tareas con superficie y criterios, y: «Revisa especialmente las aserciones; son el contrato».
11. `agent-gh.sh pr checks <n> --watch`. Confirma en el log: compuerta OK, trazabilidad OK y `RED confirmado` con N pruebas.
12. **GATE:** el humano revisa e integra. Si pide cambios, **R1** al dueño del artefacto y vuelve al punto 11.

## 3. Implementación (una tarea a la vez)
Para cada tarea, en orden:
1. `git fetch origin && git branch --no-track task/<ID>/<TASK> origin/dev` y `bash .claude/scripts/aes-wt.sh delegate task/<ID>/<TASK>`.
2. Delega en **programmer** (o **mechanic**) con **P1**.
3. Si reporta `BLOCKED` con una **pregunta de diseño**, respóndela tú con una enmienda a la nota de diseño (mismo método: hechos, no su descripción) en un PR de `spec/`, y vuelve a delegar. Si es otra causa, analízala y decide (aclarar la tarea con un PR de `spec/`, preguntar al humano o dividir). No amplíes la superficie sin aprobación humana.
4. Comprueba tú, sin abrir la rama: `git log origin/dev..task/<ID>/<TASK> --oneline` y `git diff origin/dev...task/<ID>/<TASK> --stat`. Guardián local: `bash .claude/scripts/aes-wt.sh run task/<ID>/<TASK> -- env BASE_REF=origin/dev TASK_SCOPE_FILE=specs/<ID>/<TASK>.scope bash ci/aes-guard.sh`.
5. `git push -u origin task/<ID>/<TASK>` y abre el PR con `--base dev` (`<tipo>(<ID>): <resultado>`). En el cuerpo, enlaza la tarea y pega el reporte del programador bajo «Reporte del programador (no es evidencia)».
6. `agent-gh.sh pr checks <n> --watch`. Lee el log:
   - **Rojo solo en «PASS del verificador aprobado»** (y, si la tarea autoriza dependencias, en `[dependencias]`): es lo esperado; no cuenta como ciclo FAIL. Si hay dependencias, pídele al humano que revise y ponga `aes:deps-approved`; la CI se relanza sola. La CI la conserva en los commits siguientes que no cambian manifiestos ni lockfiles.
   - **Rojo por otra causa:** un ciclo FAIL. Clasifica la causa (AES 05 §6, skill `aes-debugging`) y corrige con **R2**. Si es el **segundo** ciclo de la tarea por un defecto del código (no de la nota ni del harness) y la tarea está en nivel estándar, propónle al humano subir el tercero a `alto`: con su sí, es un PR de `spec/` que cambia el «Nivel de modelo» de la tarea, y lo anotas como decisión.
   - **SAST:** un hallazgo nuevo `ERROR` es un ciclo FAIL (R2). Los `WARNING`/`INFO` nuevos y los preexistentes se registran como defectos con severidad (skill `aes-security-review`, tabla de severidad), no bloquean la tarea. Con 3 ciclos FAIL, **circuit breaker** (AES 04 §9): detente y consulta al humano.
   - Confirma que se ejecutaron las etiquetas de los criterios de la tarea y los comandos de verificación que correspondan.
7. Todo verde salvo la verificación → `aes-wt.sh delegate task/<ID>/<TASK>` y delega en **verifier** (su binding también sale de `aes-bind.sh verifier task/<ID>/<TASK>`: una tarea de nivel alto puede subir el verificador) con **V1** (o **V1r** si ya verificó un commit anterior de esta rama). Trabaja en un worktree limpio de la rama, no en el del programador. Antes, lee los supuestos del reporte del programador: si alguno contradice la nota o la DoD, es un R2 sin gastar una verificación.
8. Resultado del verificador:
   - **FAIL** → **R2** (cuenta un ciclo; vuelve a hacer `delegate` antes).
   - **PASS con hallazgos** → clasifícalos con la regla del perfil o, si no tiene una, la de AES 02 §9.3: **defecto de la tarea Media o mayor** → ciclo FAIL (R2); **defecto de la tarea Menor** → `BUG-NNN` del backlog, salvo que el humano pida corregirlo ahora; **hueco de la especificación** → corrección de la nota y del catálogo en el cierre, nunca un ciclo; **preexistente** → defecto del backlog con severidad; un Menor nuevo en una reverificación, fuera de lo que cambió el ciclo → backlog. Si el verificador no indicó el tipo, decídelo tú con la nota en la mano. Anota cada clasificación como decisión y muéstrasela al humano en **G1**, que puede cambiarla.
   - **PASS** → **G1** al humano.
9. El humano pone `aes:verified`, la CI pasa a verde y él integra (squash). Entre la última tarea y el cierre no se integra nada más.

## 4. Cierre del elemento
1. Con todas las tareas integradas: `git pull` en `dev`, `bash ci/validate.sh` y la aceptación de `<ID>`.
2. Prepara para el humano una **demo** concreta y pídele `Accepted` o `Rejected`. Pídele también `/cost`, y que **detenga los servidores de la demo** antes de seguir: la compuerta de fin de rol del mecánico falla si quedan puertos ocupados.
3. Si `Accepted`: `git branch --no-track spec/<ID>-close origin/dev`, `aes-wt.sh delegate spec/<ID>-close` y:
   - delega en **mechanic** con **M1** (consolidar `.aes/` y la fila de métricas en `docs/`). Las notas están en `.aes/` del checkout principal. Con el subagente de Claude, pon en M1 la ruta absoluta; con OpenCode, `aes-oc.sh` copia `.aes/*-pending.md` al `.aes/` del worktree (fuera de él, OpenCode no deja leer), así que en M1 va la ruta relativa `.aes/`;
   - después, `p=$(aes-wt.sh open spec/<ID>-close)` y, dentro de `$p`:
     - actualiza `docs/design-catalog.md` con lo que introdujeron las notas de diseño (patrones nuevos y lo que se decidió no usar), y propón un ADR para lo que el plan técnico tenga de convención para otras historias;
     - **elimina el plan técnico** (AES 03 §1.2): `git rm specs/<ID>/plan.md specs/<ID>/TASK-* specs/<ID>/acceptance-test-plan.md`. Se conservan `specs/<ID>/<ID>.md` y los `*.verify`; lo eliminado queda en el historial de git. Anota en «Cierre» de la historia qué consolidaste;
     - escribe tú `docs/retrospectives/<ID>.md`: **solo** patrones, un control por patrón y decisiones abiertas;
     - si algún rol corrió en OpenCode, añade a la retrospectiva la salida de `bash .claude/scripts/aes-oc.sh report <ID>` (tokens y costo estimado por rol) y cuántas reanudaciones o BLOCKED hubo;
     - transcribe lo que quede en `.aes/decisions-pending.md` a «Decisiones» de la especificación;
     - registra cada defecto que el humano dejó para después en `docs/backlog.md` (fila con ID `BUG-NNN`, **Severidad** y Estado `Draft`) y su nota con criterio, historia de origen y reproducción (plantilla `templates/defect.md` de AES);
     - actualiza el estado del elemento y del backlog, y agrega `<ID>` a `specs/active-stories.txt`;
   - commit, push y `aes-wt.sh close spec/<ID>-close`.
4. PR con `--base dev` (o `--base main` en un hotfix). Confirma en el log `tipo: close | elemento: <ID>`, que la aceptación `@<ID>` y sus comandos de verificación se ejecutaron y pasaron. **GATE** de aprobación.
5. Después de integrar el cierre, pídele al humano que ejecute `bash .claude/scripts/aes-note.sh clear`, haz `git pull` y confirma el tablero (el hook ya lo regeneró; si no, ejecútalo): `node .claude/scripts/aes-board.mjs` (lo deja en `.aes/board.html`; si el perfil tiene un adaptador a otro tablero, ejecútalo con `--json`).
6. Evalúa la compuerta (`BASE=origin/dev bash ci/defect-gate.sh start <siguiente>`) y dile al humano qué sigue: el lote de estabilización, un release (sección 7) o la siguiente historia. La siguiente va en una **sesión nueva**: pídele al humano `/clear` (el contexto acumulado de un elemento es lo más caro de la sesión siguiente).

## 5. Camino corto T1: defecto, chore o lote de estabilización
Un solo PR de especificación y pruebas, tareas, verificación y cierre. Sin funcionalidad nueva: si aparece, el elemento sube de track.
1. `p=$(bash .claude/scripts/aes-wt.sh open qa/<ID>)` (en un hotfix: `… open qa/<ID> origin/main`). Escribe en `$p` `specs/<ID>/<ID>.md` con la plantilla de AES (`defect.md` o `stabilization-batch.md`): para cada defecto, severidad, historia de origen, comportamiento correcto como fila `| BUG-NNN | … |` de la tabla, y reproducción. Un chore lleva su criterio como `| AC-01 | … |`.
2. Commit, `aes-wt.sh close qa/<ID>`, `aes-wt.sh delegate qa/<ID>` y delega en **qa** con **Q1**: escribe la comprobación de cada criterio (prueba de aceptación con la etiqueta del elemento y la del defecto, o comando de verificación `specs/<ID>/BUG-NNN.verify`) y confirma RED. Excepciones:
   - **Prueba inestable** (el defecto es una prueba): QA la corrige en la suite de su historia; no hay RED, sino evidencia de estabilidad. Su comprobación es un comando `specs/<ID>/BUG-NNN.verify` que empieza por `# aes: no-red prueba inestable` y ejecuta esas pruebas con `--repeat-each=<N del perfil>`. En el plan, las corridas que fallaban antes.
   - **Sin RED posible:** el comando empieza por `# aes: no-red <motivo>` y el humano lo aprueba de forma explícita en el PR.
3. Tareas como en 2.7, agrupadas por superficie; el `.criteria` lista `BUG-NNN` o `AC-NN`. Un lote cuyas correcciones son todas de QA puede no tener tareas.
4. Marca `Ready` y abre el PR (`qa(<ID>): …`, `--base dev`; en un hotfix, `--base main`). La CI ejecuta el RED de las pruebas y de los comandos nuevos. **GATE** del humano: aprueba la severidad, los criterios y las comprobaciones.
5. Implementación, cierre y compuerta: secciones 3 y 4. En un lote, un defecto que no se corrige sigue abierto y la compuerta sigue cerrada.

## 6. T0 (trivial)
Base `dev`, como todo.
1. PR `spec/<ID>` con la tarea y su `.scope`. Integrado por el humano.
2. Tarea con **mechanic** (o programmer) con **P1**; CI; el perfil dice si hace falta verificador. El humano integra.
3. Estado en el backlog.

## 7. Release (`dev` → `main`)
Cuando el humano decide liberar (AES 07 §8):
1. `BASE=origin/dev bash ci/defect-gate.sh release ""` debe dar OK, y `git merge-base --is-ancestor origin/main origin/dev` debe ser cierto. Si no, primero el back-merge (sección 8) o el lote de estabilización.
2. `p=$(aes-wt.sh open spec/REL-NNN)`: escribe `docs/releases/REL-NNN.md` (plantilla `templates/release.md` de AES) y marca como `Released` los elementos que salen. PR a `dev`; el humano lo integra.
3. Abre el PR de release: `agent-gh.sh pr create --base main --head dev --title "release: REL-NNN"`, con las notas en el cuerpo. Confirma en el log: compuerta, «main contenido en dev» y regresión completa.
4. **GATE:** el humano lo integra con **merge commit** (no squash) y marca la versión.
5. Inmediatamente, el back-merge (sección 8).

## 8. Hotfix y back-merge
**Hotfix** (AES 07 §9): un defecto de algo que ya está en `main` cuya ruta el humano decidió que sea hotfix (decisión registrada en el defecto). Es la sección 5 con estas diferencias: todas sus ramas nacen de `origin/main` (`aes-wt.sh open <rama> origin/main`, `git branch --no-track <rama> origin/main`), todos sus PR van a `--base main` y la compuerta y la superficie se leen de `main`. Solo un `BUG-NNN` puede ir por aquí.

**Back-merge**, justo después de cada integración en `main` (hotfix o release):
1. `agent-gh.sh pr create --base dev --head main --title "chore: back-merge main → dev"`.
2. Si hay conflictos, no los resuelvas tú: díselo al humano con los archivos en conflicto. Resolverlos es cambiar código en `dev`, y ningún rol lo tiene asignado.
3. Confirma la regresión de `dev` en el log. **GATE:** el humano lo integra con **merge commit**.

## Plantillas

Copia el texto tal cual y sustituye solo lo que va entre `<>`.

**Q1 — QA escribe las comprobaciones**
> Elemento `<ID>`. Lee `specs/<ID>/<ID>.md` y sigue tu contrato: escribe las pruebas de aceptación (o los comandos de verificación) con sus etiquetas, confirma RED con `ci/red-check.mjs` (y `ci/run-verify.sh`) y deja el plan en `specs/<ID>/acceptance-test-plan.md`.

**Q2 — Devolverle trabajo a QA** (RED o trazabilidad inválidos)
> Elemento `<ID>`: tu entrega no cumple `<regla>`. Evidencia: `<salida literal de la herramienta>`. Corrige siguiendo tu contrato y vuelve a ejecutar las comprobaciones.

**P1 — Implementar una tarea** (programmer o mechanic)
> Tarea `<ID>/<TASK>`. Trabajas en un worktree propio de la rama `task/<ID>/<TASK>`. Lee `specs/<ID>/<TASK>.md`, `specs/<ID>/<TASK>.scope` y `specs/<ID>/<TASK>.criteria` si existe, y sigue tu contrato.

**V1 — Verificar una tarea**
> Verifica la tarea `<ID>/<TASK>` en la rama actual contra su especificación, siguiendo tu contrato. Resultado de la CI: `<enlace del run>` (`<pasos y resultado>`). Puntos de atención (hechos, no conclusiones; opcional, máximo 3): `<commit o archivo — qué cambió>`.

**V1r — Reverificar tras un ciclo FAIL**
> Reverifica la tarea `<ID>/<TASK>` en la rama actual, siguiendo tu contrato (reverificación). Ya verificaste `<commit>`; el ciclo FAIL `<n>` corrigió: `<hallazgos, uno por línea>`. Resultado de la CI: `<enlace del run>` (`<pasos y resultado>`).

**V2 — Verificar a posteriori** (solo si algo se integró sin verificación; anótalo como incidente)
> Verificación a posteriori de `<ID>/<TASK>`, ya integrada en `<dev o main>` (`<hash>`) sin verificación. Verifica esa rama contra la especificación de la tarea, siguiendo tu contrato. Hechos: `<qué ejecutó la CI y qué no>`. No dispones de los commits individuales (squash).

**R1 — Corrección tras revisión humana** (al dueño del artefacto)
> Corrección en `<ID>` pedida por el humano: `<cambio, en una frase>`. Motivo: `<regla o criterio>`. Haz solo ese cambio, siguiendo tu contrato, y actualiza el plan si corresponde.

**R2 — Corrección tras un FAIL** (al programador, en la misma rama)
> Tarea `<ID>/<TASK>`, ciclo FAIL `<n>` de 3. Fallo: `<salida literal del check o hallazgo del verificador: criterio, reproducción>`. Corrige siguiendo tu contrato, sin salir de la superficie. Si la corrección exige salir de ella, reporta BLOCKED.

**M1 — Consolidar notas en el cierre** (mechanic, rama `spec/<ID>-close`)
> Cierre de `<ID>`. Pasa el contenido de `.aes/findings-pending.md` a la tabla «Registro» de `docs/harness-findings.md` y el de `.aes/failures-pending.md` a `docs/agent-failure-log.md` (formato FL-NNN, siguiente número libre). Agrega la fila de `<ID>` a «Métricas por elemento»: `<inicio, fin, modelo real por rol, ciclos FAIL, intervenciones, bloqueos (hooks / permisos / clasificador), costo, tiempos>`. No vacíes `.aes/`. Haz un commit `docs(<ID>): consolidar hallazgos y métricas`. Solo cambias el formato, no el contenido.

**G1 — Al humano, tras un PASS**
> `<ID>/<TASK>`: PASS del verificador. Informe: `<resumen de evidencia y enlace>`. Hallazgos y su clasificación (02 §9.3): `<F-n — origen, tipo, severidad → ciclo / backlog / nota>` o «ninguno». Si estás de acuerdo, pon `aes:verified` en el PR #`<n>`; la CI se relanza y, en verde, puedes integrar. No integres con la CI en rojo.

## Si algo no encaja
Si el harness no permite hacer algo de esta skill tal como está escrito, no improvises un atajo silencioso: hazlo de la forma más cercana posible, anótalo como hallazgo y avísale al humano.
