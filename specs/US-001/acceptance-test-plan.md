# Plan de pruebas de aceptación — US-001

- **Versión de la historia:** [`specs/US-001/US-001.md`](US-001.md) en `44f5f24`, con las decisiones D-05 a D-12 (corrección del indicador de largo, 2026-11-25).
- **Track:** T2
- **Preparado por:** QA / diseñador de pruebas (DeepSeek Flash)
- **Estado:** Draft (pendiente de aprobación humana)

## Fuente contractual

- Historia y criterios aprobados: [`specs/US-001/US-001.md`](US-001.md), criterios AC-01 a AC-08 y decisiones D-01 a D-12.
- Contrato de interfaz: [`specs/US-001/plan.md`](plan.md), secciones «API», «Pantalla» y «Restricciones para las pruebas».
- Convenciones del proyecto: [`DESIGN.md`](../../DESIGN.md) (pantalla de la app), [ADR-001](../../docs/adr/ADR-001-stack.md) (Axum + SQLite + React, sesión por cookie, Argon2id) y las pruebas de [`tests/acceptance`](../../tests/acceptance/README.md).

Las pruebas hablan con la app solo por su contrato: HTTP para la API y roles/nombres accesibles para la pantalla. No se usan clases ni `data-testid`, ni se leen el código ni las pruebas unitarias de la implementación para diseñarlas.

## Matriz de trazabilidad

Cada prueba lleva la etiqueta del elemento (`@US-001`) y la del criterio (`@US-001-AC-NN`), y su título empieza por el ID del criterio.

| Criterio | Prueba (título) | Tipo | Visible/oculta | Automática/manual | Evidencia esperada |
|---|---|---|---|---|---|
| AC-01 | AC-01 sin cuenta, la app muestra «Crear la cuenta» con sus campos, el botón de mostrar, el indicador de largo («Faltan 12 caracteres» desde vacío) y «Crear cuenta» | Aceptación (Playwright) | Visible | Automática | Encabezado y controles visibles; el indicador dice «Faltan 12 caracteres» desde que se abre la pantalla y se actualiza al escribir |
| AC-02 | AC-02 con un usuario y una contraseña válidos se crea la cuenta, el dueño entra con su sesión, ve el usuario en minúsculas y sigue dentro al recargar | Aceptación (Playwright) | Visible | Automática | «Sesión iniciada como keylor», `GET /api/session` correcto y sesión tras `reload` |
| AC-02 | AC-02 con el usuario mínimo (3 caracteres) y la contraseña mínima (12) se crea la cuenta | Aceptación (Playwright) | Visible | Automática | Cuenta creada en el límite inferior |
| AC-02 | AC-02 con el usuario máximo (32 caracteres) y la contraseña máxima (128) se crea la cuenta | Aceptación (Playwright) | Visible | Automática | Cuenta creada en el límite superior |
| AC-02 | AC-02 una contraseña de 12 caracteres Unicode (emojis) es válida: se cuentan puntos de código, no bytes | Aceptación (Playwright) | Visible | Automática | Cuenta creada con 12 puntos de código |
| AC-03 | AC-03 con datos inválidos no se crea la cuenta, cada campo con problema muestra qué corregir y lo escrito se conserva | Aceptación (Playwright) | Visible | Automática | Errores visibles y asociados a su campo, valores conservados y `GET /api/session` con `accountExists: false` |
| AC-04 | AC-04 «Mostrar contraseña» muestra el texto y cambia a «Ocultar contraseña»; desde vacío el indicador dice «Faltan 12 caracteres», cuenta los que faltan y desaparece al llegar a 12 | Aceptación (Playwright) | Visible | Automática | `type="text"` en los dos campos, botón alternado y conteo desde vacío: 12, 7, 11, 1 y ausente a 12 |
| AC-05 | AC-05 con la cuenta ya creada, quien abre la app sin sesión ve «La cuenta ya está creada.» sin formulario y no puede crear otra por la API | Aceptación (Playwright) | Visible | Automática | Texto sin formulario; segundo `POST` → 409; `GET /api/session` con `accountExists: true` |
| AC-05 | AC-05 dos peticiones simultáneas con la base vacía crean una sola cuenta: una recibe 201 y la otra 409 | Aceptación (Playwright) | Visible | Automática | Estados `[201, 409]` y un tercer intento también 409 |
| AC-05 | AC-05 si la cuenta se crea mientras se llena el formulario, al pulsar «Crear cuenta» se ve «La cuenta ya está creada.» sin formulario | Aceptación (Playwright) | Visible | Automática | Un 409 de la API deja la pantalla sin formulario |
| AC-06 | AC-06 si el servidor falla, se ve «No se pudo crear la cuenta. Intentar de nuevo.», lo escrito se conserva, no queda cuenta a medias y al reintentar se crea | Aceptación (Playwright) | Visible | Automática | Aviso `role="alert"` con 503 y sin conexión; valores conservados; `accountExists: false`; alta al reintentar |
| AC-07 | `specs/US-001/US-001.verify` | Comando de verificación | Visible | Automática | La contraseña literal no está en la base ni en su `-wal` |
| AC-08 | AC-08 en escritorio la pantalla vacía y con errores no tiene incumplimientos WCAG 2.2 AA | Aceptación (Playwright) | Visible | Automática (axe-core) | `violations` vacío en ambos estados |
| AC-08 | AC-08 en un celular de 360 px la pantalla vacía, con errores y con el aviso de fallo no tiene incumplimientos WCAG 2.2 AA ni desplazamiento horizontal | Aceptación (Playwright) | Visible | Automática (axe-core) | `violations` vacío y `scrollWidth <= viewport` en los tres estados |
| AC-08 | AC-08 todo el alta de la cuenta se puede hacer solo con el teclado | Aceptación (Playwright) | Visible | Automática | Todos los controles alcanzables con Tab; error y corrección, y alta completada con Enter |

## Pruebas de caracterización

No hay. US-001 introduce la pantalla, la API y la sesión: contra la base `44f5f24` no existe ninguno de esos comportamientos, así que todas las pruebas nuevas pueden mostrar RED. La línea de estado de EN-001 se mantiene (regresión), pero su criterio no es de US-001 y queda en su propia suite.

## Escenarios

Precondición común: una base SQLite nueva, sin cuenta, por prueba (el fixture arranca un servidor por prueba). Datos sintéticos; no se usan datos reales.

- **AC-01 — pantalla inicial.** Abrir `/`. Esperado: encabezado «Crear la cuenta», campos «Usuario», «Contraseña» y «Repetir la contraseña», botón «Mostrar contraseña», botón «Crear cuenta» y el indicador de largo, que con el campo vacío dice «Faltan 12 caracteres» y pasa a «Faltan 11 caracteres» al escribir uno (D-05). Limpieza: el fixture detiene el servidor y borra la base.
- **AC-02 — alta y sesión.** Escribir un usuario con mayúsculas (`Keylor`) y una contraseña válida repetida; pulsar «Crear cuenta». Esperado: «Sesión iniciada como keylor», `GET /api/session` → `{accountExists: true, username: "keylor"}` y la misma pantalla tras recargar.
- **AC-02 — bordes válidos.** Repetir el alta con usuario de 3 y contraseña de 12; con usuario de 32 y contraseña de 128; y con 12 emojis como contraseña.
- **AC-03 — datos inválidos.** Enviar usuario de 2 y de 33, con espacio y con acento; contraseña de 11, de 129 y de 11 emojis; repetición distinta. Esperado: cada campo con problema muestra su texto, la descripción accesible del campo lo incluye, lo escrito se conserva y `GET /api/session` sigue con `accountExists: false`.
- **AC-04 — ayudas de contraseña.** Con el campo vacío al abrir la pantalla, y luego escribiendo 5, 1 emoji, 11 y 12 caracteres; alternar «Mostrar contraseña»/«Ocultar contraseña». Esperado: «Faltan 12 caracteres» desde vacío (D-05), «Faltan 7 caracteres», «Faltan 11 caracteres» (un emoji es un carácter), «Falta 1 carácter», sin indicador a los 12; el texto se muestra en los dos campos y el botón cambia de nombre.
- **AC-05 — cuenta existente.** Crear la cuenta con un cliente HTTP sin cookies; abrir `/` en otro cliente sin sesión. Esperado: «La cuenta ya está creada.», sin formulario; segundo `POST /api/account` → 409 `account_exists`; `GET /api/session` sin cookie → `{accountExists: true, username: null}`; el estado se mantiene al recargar.
- **AC-05 — concurrencia.** Con la base vacía, dos `POST /api/account` simultáneos con usuarios distintos. Esperado: exactamente un 201 y un 409; un tercer intento → 409.
- **AC-05 — 409 tardío.** Con el formulario lleno, interceptar `POST /api/account` y responder 409. Esperado: «La cuenta ya está creada.» sin formulario.
- **AC-06 — fallo y reintento.** Interceptar el `POST` para responder 503 y luego abortar la conexión; después dejar pasar la petición real. Esperado: aviso «No se pudo crear la cuenta. Intentar de nuevo.», valores conservados, ninguna cuenta creada tras los fallos y alta correcta al reintentar.
- **AC-07 — contraseña en la base.** Arrancar el servidor, crear una cuenta por la API y leer los bytes de la base y de su `-wal`. Esperado: la contraseña literal no aparece.
- **AC-08 — accesibilidad y teclado.** Analizar con axe-core (mismas etiquetas WCAG 2.2 AA que EN-001) la pantalla vacía, con errores y con el aviso de AC-06, en escritorio y a 360 px; comprobar `scrollWidth`; completar el alta solo con Tab, Enter y teclado, incluidos el error, la corrección y el mostrar/ocultar la contraseña.

## Casos negativos y de borde

| Caso | Valor | Resultado esperado | Criterio |
|---|---|---|---|
| Usuario demasiado corto | `ab` | Error de usuario | AC-03 |
| Usuario demasiado largo | 33 caracteres | Error de usuario | AC-03 |
| Usuario con espacio | `con espacio` | Error de usuario | AC-03 |
| Usuario con acento | `josé` | Error de usuario | AC-03 |
| Contraseña corta | 11 caracteres | Error de contraseña | AC-03 |
| Contraseña larga | 129 caracteres | Error de contraseña | AC-03 |
| Contraseña corta en puntos de código | 11 emojis | Error de contraseña | AC-03 |
| Repetición distinta | dos contraseñas válidas distintas | Error solo en «Repetir la contraseña» | AC-03 |
| Límites aceptados | usuario 3/32, contraseña 12/128, 12 emojis | Cuenta creada | AC-02 |
| Indicador con el campo vacío | 0 caracteres | «Faltan 12 caracteres» desde que se abre la pantalla | AC-01, AC-04 |
| Indicador en el límite | 11 → 12 caracteres | «Falta 1 carácter» y luego ausente | AC-04 |
| Dos altas simultáneas | base vacía | Una 201, otra 409 | AC-05 |
| Fallo del servidor | 503 y conexión abortada | Aviso y sin cuenta a medias | AC-06 |

## Seguridad y autorización

- La contraseña no se guarda tal cual: AC-07 inspecciona el archivo SQLite y su `-wal` en busca del texto literal (el contrato exige hash Argon2id).
- La regla de una sola cuenta se comprueba en el servidor, no solo en la pantalla: AC-05 usa `POST /api/account` directo y dos peticiones simultáneas.
- Un cliente sin cookie válida no recibe el nombre del usuario: `GET /api/session` devuelve `username: null` (AC-05).
- La sesión sobrevive a la recarga (AC-02), coherente con la cookie `HttpOnly`, `SameSite=Strict` y sin caducidad del contrato.
- Quedan fuera de esta historia el inicio de sesión, el límite de intentos (US-002), el cierre de sesión (US-003) y CSRF más allá de `SameSite` (se especifica en US-002).

## Regresión relevante

- EN-001 (6 pruebas) y ST-001 (5 pruebas) siguen pasando con el fixture de alcance por prueba: **11 passed** el 2026-11-25. No se cambiaron sus aserciones; solo el ciclo de vida del servidor, que ahora arranca una base nueva por prueba.
- La línea «Conectado con el servidor» de EN-001 no se toca en ninguna aserción de US-001.

## Automatización y entorno

- **Framework:** Playwright 1.65.1 con Chromium, `@axe-core/playwright` 4.14.0; un solo worker y el puerto fijo `127.0.0.1:5080` (sin `reuseExistingServer`).
- **Fixture:** [`tests/acceptance/fixtures/app.ts`](../../tests/acceptance/fixtures/app.ts) tiene alcance de prueba: cada prueba arranca su propio servidor con una base nueva en una carpeta temporal y lo detiene (y borra la carpeta) al terminar. La web se compila antes de arrancar el primer servidor; el puerto se espera libre antes de cada arranque. Esto no cambia el comportamiento observable de EN-001 ni de ST-001.
- **Aislamiento:** cada prueba crea lo que necesita en su propia base; no se comparan totales globales ni se depende del orden. No hay `mode: 'serial'` ni pruebas que queden sin ejecutar tras un fallo.
- **Comando de verificación AC-07:** `specs/US-001/US-001.verify` compila el servidor, arranca el binario con una base temporal en el puerto 5098, crea la cuenta por `fetch` de Node y busca la contraseña en la base y su `-wal`. Sale con 0 si no aparece y con distinto de 0 si aparece o si no se pudo crear la cuenta.

## Supuestos que necesitan una decisión

Todos los supuestos de la primera entrega quedaron resueltos por las decisiones D-05 a D-12 del humano (2026-11-25); no queda ninguno abierto. La tabla conserva el supuesto y su decisión.

| # | Supuesto | Pruebas afectadas | Decisión (D-NN) |
|---|---|---|---|
| 1 | AC-01 dice que la pantalla muestra «el indicador de largo», y AC-04 que cuenta los caracteres que faltan mientras se escribe. Se fija que el indicador se ve desde que la pantalla se abre: con el campo vacío dice «Faltan 12 caracteres» y desaparece al llegar a 12. | AC-01, AC-04 | **D-05** (resuelto): desde vacío, «Faltan 12 caracteres», ausente con 12 o más; contrato del plan actualizado |
| 2 | Los errores de campo se exponen como **descripción accesible** del campo (plan: «asociados a él (descripción accesible)»); la prueba usa `toHaveAccessibleDescription`. Si se decide que `aria-errormessage` es suficiente, hay que ajustar la prueba. | AC-03 | **D-06** (resuelto): como descripción accesible del campo |
| 3 | «La cuenta ya está creada.» y «Sesión iniciada como <usuario>» se muestran como un texto accesible único y exacto, en minúsculas para el usuario. | AC-02, AC-05 | Texto exacto aceptado en **D-12** |
| 4 | AC-05 exige que «la existente no cambie», pero sin inicio de sesión (US-002) no se puede volver a leer su usuario. Se comprueba con `accountExists: true`, el rechazo de una segunda cuenta y el estado estable al recargar. | AC-05 | **D-07** (resuelto): con lo que ya se puede observar |
| 5 | La prueba de concurrencia usa dos usuarios distintos; el criterio no dice si deben ser iguales. Solo se exige un 201 y un 409. | AC-05 | **D-08** (resuelto): distintos; solo uno se crea |
| 6 | El plan dice que el aviso de fallo desaparece «al volver a pulsar Crear cuenta»; no se comprueba el estado transitorio (carrera) y se exige que desaparezca al completarse el alta correcta. | AC-06 | **D-09** (resuelto): no está al terminar el alta correcta |
| 7 | El 409 que llega después de abrir el formulario (alguien creó la cuenta mientras tanto) se considera parte de AC-05 «por cualquier camino», como pide el plan. | AC-05 | **D-10** (resuelto): sí, se ve «La cuenta ya está creada.» |
| 8 | «Cualquier tipo» de contraseña incluye emojis y se cuentan puntos de código Unicode (plan: `chars().count()` / `[...s].length`): 11 emojis son inválidos y 12 son válidos. | AC-02, AC-03, AC-04 | Contrato explícito, aceptado en **D-12** |
| 9 | AC-07 revisa la base y su `-wal`; no se revisan `-shm`, copias de seguridad ni volcados. Se asume que «en ningún lado» se limita a los datos persistidos por la app en esta prueba. | AC-07 | **D-11** (resuelto): la base y su registro de escritura |
| 10 | La accesibilidad automática usa el mismo conjunto de etiquetas WCAG 2.2 AA que EN-001 (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`); axe no sustituye la revisión manual de todos los criterios. | AC-08 | Convención de EN-001, aceptada en **D-12** |
| 11 | El teclado se prueba con el orden natural de tabulación (sin asumir un orden concreto) y activando los botones con Enter; no se prueba la visibilidad del anillo de foco (eso es ST-001/DESIGN). | AC-08 | **D-12** (resuelto): orden natural, sin el anillo de foco |
| 12 | AC-05 fija el estado «La cuenta ya está creada.» **sin formulario**. D-01 dice que US-002 pondrá ahí el formulario de inicio de sesión: cuando se implemente US-002, esa prueba de US-001 habrá que revisarla junto con su criterio. | AC-05 | **D-01** y **D-12**: revisar cuando US-002 cambie el texto |

## RED confirmado

- **Base:** rama `qa/US-001` en `44f5f24` (antes de implementar US-001), con la corrección del indicador D-05 del 2026-11-25 (sin commit al ejecutarse), 2026-11-25.
- **Pruebas de aceptación:**

```bash
PLAYWRIGHT_JSON_OUTPUT_NAME="C:/Users/keylo/AppData/Local/Temp/opencode/us001-red-d05.json" \
  npm --prefix tests/acceptance test -- --grep "@US-001(?![\w-])" --reporter=list,json
node ci/red-check.mjs "C:/Users/keylo/AppData/Local/Temp/opencode/us001-red-d05.json" US-001 0 specs/US-001/US-001.md
```

Salida literal de `ci/red-check.mjs`:

```text
Item: @US-001 | tests found: 14 | run: 14
  - [failed] AC-01 sin cuenta, la app muestra «Crear la cuenta» con sus campos, el botón de mostrar, el indicador de largo («Faltan 12 caracteres» desde vacío) y «Crear cuenta»  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-02 con un usuario y una contraseña válidos se crea la cuenta, el dueño entra con su sesión, ve el usuario en minúsculas y sigue dentro al recargar  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-02 con el usuario mínimo (3 caracteres) y la contraseña mínima (12) se crea la cuenta  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-02 con el usuario máximo (32 caracteres) y la contraseña máxima (128) se crea la cuenta  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-02 una contraseña de 12 caracteres Unicode (emojis) es válida: se cuentan puntos de código, no bytes  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-03 con datos inválidos no se crea la cuenta, cada campo con problema muestra qué corregir y lo escrito se conserva  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-04 «Mostrar contraseña» muestra el texto y cambia a «Ocultar contraseña»; desde vacío el indicador dice «Faltan 12 caracteres», cuenta los que faltan y desaparece al llegar a 12  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-05 con la cuenta ya creada, quien abre la app sin sesión ve «La cuenta ya está creada.» sin formulario y no puede crear otra por la API  →  Error: expect(received).toBe(expected) // Object.is equality
  - [failed] AC-05 dos peticiones simultáneas con la base vacía crean una sola cuenta: una recibe 201 y la otra 409  →  Error: expect(received).toEqual(expected) // deep equality
  - [failed] AC-05 si la cuenta se crea mientras se llena el formulario, al pulsar «Crear cuenta» se ve «La cuenta ya está creada.» sin formulario  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-06 si el servidor falla, se ve «No se pudo crear la cuenta. Intentar de nuevo.», lo escrito se conserva, no queda cuenta a medias y al reintentar se crea  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-08 en escritorio la pantalla vacía y con errores no tiene incumplimientos WCAG 2.2 AA  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-08 en un celular de 360 px la pantalla vacía, con errores y con el aviso de fallo no tiene incumplimientos WCAG 2.2 AA ni desplazamiento horizontal  →  Error: expect(locator).toBeVisible() failed
  - [failed] AC-08 todo el alta de la cuenta se puede hacer solo con el teclado  →  Error: expect(locator).toBeVisible() failed
Traceability OK: 14 tests, all with a criterion from specs/US-001/US-001.md.
RED confirmed: the 14 tests of @US-001 ran and failed. Check above that each one fails for the expected reason.
```

| Escenario | Resultado contra la base | Motivo del fallo | ¿Es el motivo esperado? |
|---|---|---|---|
| AC-01 pantalla inicial (incluye «Faltan 12 caracteres» desde vacío, D-05) | FAIL | No existe el encabezado «Crear la cuenta» (`getByRole('heading')` no encuentra nada) | Sí — la pantalla no existe, así que tampoco su indicador inicial |
| AC-02 alta válida | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-02 límites mínimos | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-02 límites máximos | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-02 Unicode | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-03 datos inválidos | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-04 ayudas de contraseña (incluye «Faltan 12 caracteres» desde vacío, D-05) | FAIL | No existe el encabezado «Crear la cuenta» | Sí — la pantalla no existe, así que tampoco su indicador inicial |
| AC-05 cuenta existente | FAIL | `POST /api/account` → 404 `not_found` (la ruta no existe) | Sí |
| AC-05 concurrencia | FAIL | Los dos `POST /api/account` → 404 `not_found` | Sí |
| AC-05 409 tardío | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-06 fallo y reintento | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-08 axe escritorio | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-08 axe 360 px | FAIL | No existe el encabezado «Crear la cuenta» | Sí |
| AC-08 teclado | FAIL | No existe el encabezado «Crear la cuenta» | Sí |

Ninguna prueba se saltó ni pasó. Las dos que fallan en la API lo hacen con `404`, no por un error de la propia prueba; las demás fallan porque la pantalla de US-001 no existe todavía. Las aserciones nuevas de AC-01 y AC-04 para D-05 se ejecutan después de la comprobación del encabezado: cuando la pantalla exista, la primera aserción del indicador exigirá «Faltan 12 caracteres» con el campo vacío.

### Comando de verificación AC-07

Ejecución directa contra la base actual:

```text
$ bash specs/US-001/US-001.verify
Arrancando el servidor con una base nueva para comprobar la contraseña guardada.
POST /api/account → HTTP 404: {"error":{"code":"not_found","message":"La ruta solicitada no existe"}}
AC-07 NO se cumple: no se pudo crear la cuenta para inspeccionar la base.
   servidor:     Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.32s
   servidor:     2026-11-26T04:59:41.634983Z  INFO aes_todo: servidor escuchando addr=127.0.0.1:5098
EXIT=1
```

`ci/run-verify.sh red HEAD specs/US-001/US-001.verify` no puede leer el archivo todavía porque QA no hace commits (contrato de QA) y el `.verify` es nuevo en la rama:

```text
$ bash ci/run-verify.sh red HEAD specs/US-001/US-001.verify
FAIL [verify] specs/US-001/US-001.verify does not exist in HEAD.
EXIT=1
```

Una vez que el orquestador confirme el commit de `qa/US-001`, la misma orden de CI ejecutará el archivo y obtendrá el RED por la causa real (arriba). **El orquestador debe repetir `bash ci/run-verify.sh red HEAD specs/US-001/US-001.verify` sobre su commit antes de dar el RED por cerrado.**

- **Salida/artefacto:** informe Playwright JSON en `C:/Users/keylo/AppData/Local/Temp/opencode/us001-red-d05.json` (no versionado); trazas en `tests/acceptance/test-results/` (no versionadas).

## Protección

- **Ubicación de la suite visible:** [`tests/acceptance/tests/us-001.spec.ts`](../../tests/acceptance/tests/us-001.spec.ts) y [`specs/US-001/US-001.verify`](US-001.verify).
- **Ubicación de la suite oculta (holdout):** no hay suite holdout para US-001; los criterios de UI y API quedan cubiertos por la suite visible.
- **Compromiso/base de confianza:** `44f5f24` en `qa/US-001`.
- **Mecanismo de protección (L3):** CI ejecuta `red-check.mjs` sobre el informe de Playwright y `run-verify.sh` sobre el `.verify`; ambas son las mismas reglas que usa el harness local.
- **Quién puede aprobar cambios:** el responsable del producto, GG_WellCoded (aprobador de US-001), previa revisión de QA.

## Aprobación

- **QA:** DeepSeek Flash (rol QA / diseñador de pruebas), 2026-11-25; corrección del indicador D-05 revisada el 2026-11-25.
- **Humano que aprobó los criterios y las pruebas:** pendiente (GG_WellCoded).
- **Fecha/commit de la línea base:** 2026-11-25, `44f5f24`.
