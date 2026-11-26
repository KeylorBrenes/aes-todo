# TASK-002 — El formulario «Crear la cuenta» ayuda a escribir la contraseña, explica cada error y avisa si no se pudo crear

- **Historia:** US-001
- **Track:** T2
- **Estado:** Ready
- **Agente asignado:** programmer
- **Nivel de modelo:** estándar
- **Datos que ve el rol:** solo código
- **Riesgo:** Medio
- **Ciclos FAIL acumulados:** 0 / 3

## Objetivo y resultado esperado
Sobre el formulario de TASK-001: «Mostrar / Ocultar contraseña», el indicador «Faltan N caracteres», un error junto a cada campo con problema (sin llamar al servidor), el aviso «No se pudo crear la cuenta. Intentar de nuevo.» ante un fallo, y toda la pantalla accesible y usable con teclado y en 360 px.

## Alcance
Solo la web: reglas de usuario y contraseña en el cliente (iguales a las del servidor), ayudas, errores, aviso de fallo y sus estilos.

## Fuera de alcance
- El servidor: no se toca (lo hizo TASK-001).
- `App.tsx`, los módulos de `src/web/src/api/` y los estados «La cuenta ya está creada.» / «Sesión iniciada como …»: no se tocan.
- Validación mientras se escribe (los errores se calculan solo al pulsar «Crear cuenta»), medidor de fortaleza, sugerencias de contraseña.
- Inicio de sesión, cierre de sesión (US-002, US-003).

## Criterios que pone en verde
Es la última tarea: la CI ejecuta el elemento completo (AC-01 a AC-08 y `US-001.verify`). Los que agrega son AC-01, AC-03, AC-04, AC-06 y AC-08.

## Contexto técnico
- Contrato: `specs/US-001/plan.md` (textos exactos, reglas y la pantalla). Decisiones D-02 a D-06 y D-09 de `specs/US-001/US-001.md`.
- Catálogo: `docs/design-catalog.md` (textos en `i18n/es.ts`, sin estilos en línea, foco, `role="alert"` sin controles dentro).
- TASK-001 dejó `CreateAccountForm.tsx`, `createAccount` con los resultados `created` / `exists` / `invalid` / `failed`, y `.action-button`.

## Superficie de cambio
Publicada en `specs/US-001/TASK-002.scope`.

## Restricciones y permisos
Sin dependencias nuevas. Supresiones (`eslint-disable`) solo con aprobación humana.

## Nota de diseño

### Piezas
| Pieza (archivo / tipo / función) | Nueva o existente | Responsabilidad (una) |
|---|---|---|
| `src/web/src/accountRules.ts`: `checkAccountForm`, `missingCharacters` | Nueva | Reglas de usuario, contraseña y repetición en el cliente |
| `src/web/src/CreateAccountForm.tsx` | Existente | Formulario de alta: ayudas, errores y aviso de fallo |
| `src/web/src/i18n/es.ts` | Existente | Textos nuevos |
| `src/web/src/styles.css` | Existente | Estilos del indicador, de los errores, del campo inválido y del botón de mostrar |

### Patrón (nivel 2)
- **Ninguno.** Estado local del formulario con `useState`; las reglas son funciones puras.

### Lo que no se hace
- No se agrega una biblioteca de formularios ni de validación (`react-hook-form`, `zod`…): tres campos.
- No se crea un componente `Field` ni `PasswordInput` genérico: una sola pantalla (catálogo; se reconsidera en US-002).
- No se valida mientras se escribe: los errores se recalculan solo al enviar. El indicador sí se actualiza al escribir.
- No se usa `aria-pressed` en «Mostrar contraseña»: su nombre cambia, y combinar los dos confunde al lector de pantalla.
- No se usa `disabled` en «Crear cuenta» (pierde el foco), ni `maxLength`, ni `required`, ni la validación nativa del navegador (`noValidate` ya está).
- El indicador no es región viva: se anunciaría en cada tecla.

### Nivel 1 donde no es obvio
- **`accountRules.ts`:** `checkAccountForm({ username, password, repeat }): AccountFormErrors` con `{ username?: true; password?: true; repeat?: true }`. Usuario: `/^[A-Za-z0-9._-]{3,32}$/` sobre el texto tal cual. Contraseña: `[...password].length` entre 12 y 128. Repetición: error si `repeat !== password`, sea válida o no la contraseña. `missingCharacters(password): number` = `Math.max(0, 12 - [...password].length)`. Sin textos: el formulario elige el mensaje.
- **Envío** (en `CreateAccountForm`): `preventDefault`; si ya hay un envío en curso, nada; quita el aviso de fallo; `checkAccountForm`. Con errores: los guarda en el estado, mueve el foco al primer campo con error en el orden Usuario → Contraseña → Repetir la contraseña, y no llama a la API. Sin errores: limpia los errores y llama a `createAccount`. Resultado `invalid`: los `fields` del servidor se convierten en errores del formulario (`username` → error de usuario, `password` → error de contraseña) y se enfoca el primero, como en el cliente. Resultado `failed`: muestra el aviso. `created` / `exists`: como en TASK-001.
- **Textos** en `i18n/es.ts`: `showPassword` «Mostrar contraseña», `hidePassword` «Ocultar contraseña», `missingOne` «Falta 1 carácter», `missingMany(n)` «Faltan N caracteres» (función que recibe el número), `usernameError` «El usuario debe tener de 3 a 32 caracteres: letras sin acento, números, punto, guion bajo o guion.», `passwordError` «La contraseña debe tener de 12 a 128 caracteres.», `repeatError` «Las contraseñas no coinciden.», `createFailed` «No se pudo crear la cuenta. Intentar de nuevo.».
- **Marcado:** cada campo en un bloque con su `<label>`, su `<input>` y, debajo, su error `<p id="<campo>-error" className="field-error">` solo cuando existe. El indicador es `<p id="password-hint" className="field-hint">` debajo del campo «Contraseña», presente mientras `missingCharacters > 0` (con el campo vacío dice «Faltan 12 caracteres», D-05). `aria-describedby` de cada input lista solo los ids que existen en ese momento (Contraseña: `password-hint` y `password-error`); `aria-invalid="true"` solo en los campos con error. Orden en el DOM y de tabulación: Usuario → Contraseña → Repetir la contraseña → «Mostrar contraseña» → «Crear cuenta». «Mostrar contraseña» es `type="button"` y cambia los **dos** campos de contraseña entre `type="password"` y `type="text"`; es el mismo elemento en los dos estados (no se desmonta). El aviso de fallo es `<p role="alert" className="notice-text">` debajo de «Crear cuenta», fuera de cualquier botón, y solo existe mientras hay fallo.
- **Estilos:** `.field-error` 16 px, 600, `--ink` (no se usa `--danger`: `DESIGN.md` lo reserva para la papelera); el input con `aria-invalid="true"` lleva borde de 2 px `--ink`. `.field-hint` 13 px `--ink-muted`, con `font-variant-numeric: tabular-nums`. «Mostrar contraseña» es un botón secundario: fondo transparente, texto `--ink` 600, borde 1 px `--line`, totalmente redondeado, alto mínimo 44 px. Los campos ocupan el ancho de la tarjeta (`width: 100%`) para no desbordar en 360 px. Sin estilos en línea. Foco: la regla global.

### Comportamiento dinámico de la interfaz
| Transición (qué la causa) | Adónde va el foco | Qué se anuncia y en qué región viva | Anillo de foco visible |
|---|---|---|---|
| Carga inicial (sin cuenta) | No se mueve | Nada nuevo | — |
| Escribir en «Contraseña» | Se queda en el campo | Nada (el indicador cambia, pero no es región viva; se lee como descripción al enfocar el campo) | Sí (los campos de texto siempre cumplen `:focus-visible`) |
| «Mostrar / Ocultar contraseña» | Se queda en el botón | Nada; el botón cambia de nombre | Con teclado sí; con ratón no |
| «Crear cuenta» con errores del cliente | Al primer campo con error | Su error, como descripción del campo al recibir el foco; no es región viva | Sí |
| Resultado `invalid` del servidor | Igual que la fila anterior | Ídem | Sí |
| Resultado `failed` | Se queda en «Crear cuenta» | «No se pudo crear la cuenta. Intentar de nuevo.» en el `role="alert"` que se inserta | Con teclado sí; con ratón no |
| Nuevo envío tras un fallo | Se queda en «Crear cuenta» | El aviso se quita al empezar el envío; si vuelve a fallar se inserta de nuevo y se anuncia otra vez | Ídem |
| `created` / `exists` | Como en TASK-001 (al elemento de resultado) | Ídem | Ídem |

- **Regiones vivas:** solo el `role="alert"` del aviso de fallo, insertado cuando hay fallo (el mismo patrón que el aviso de conexión de EN-001); no contiene controles. Las de EN-001 no cambian.
- **Anillo por tipo de elemento** (`DESIGN.md`): la regla global para campos y botones; nada propio.
- **Espacio reservado:** ninguno: los errores, el indicador y el aviso ocupan lugar solo mientras existen.
- **Respuestas que deben cubrir las pruebas técnicas:** `accountRules` en los bordes (2, 3, 32 y 33 caracteres; espacio; acento; 11, 12, 128 y 129; 11 y 12 emojis; repetición distinta con contraseña válida e inválida) y `missingCharacters` (0, 1, 11, 12, emojis). Formulario: los tres errores juntos y el foco en Usuario; solo el de repetición y el foco en Repetir; que con errores no se llama a `createAccount`; `invalid` del servidor con cada campo; `failed` muestra el aviso y lo quita el siguiente envío; mostrar y ocultar cambian los dos campos; el indicador con 0, 1, 11 y 12 caracteres; `aria-describedby` y `aria-invalid` según el estado.

### ¿Cambia el catálogo de diseño?
Sí, en el cierre: errores por campo como descripción accesible con el foco al primero, indicador como descripción (no región viva), botón secundario y la decisión de no usar `--danger` en los errores de un formulario.

## Estados que introduce
- **Errores del formulario:** los crea un envío con errores (del cliente o `invalid` del servidor); los limpia un envío sin errores del cliente.
- **Aviso de fallo:** lo crea `failed`; lo limpia el siguiente envío al empezar.
- **Contraseña visible:** lo alterna «Mostrar / Ocultar contraseña»; empieza oculta.

## Dependencias
TASK-001 integrada en `dev`.

## Comandos exactos de validación
```
npm --prefix src/web run lint && npm --prefix src/web run typecheck && npm --prefix src/web test && npm --prefix src/web run build
npm --prefix tests/acceptance test -- --grep "@US-001(?![\w-])"
bash specs/US-001/US-001.verify
npm --prefix tests/acceptance test -- --grep "@EN-001(?![\w-])|@ST-001(?![\w-])"
```

## Pruebas de regresión afectadas
`tests/acceptance/tests/en-001.spec.ts`, `tests/acceptance/tests/st-001.spec.ts`, `src/web/src/CreateAccountForm.test.tsx`, `src/web/src/App.test.tsx`.

## Presupuesto orientativo de diff
- Producción: ~220 líneas.
- Pruebas: ~250 líneas.

## Condición de terminación
Los comandos de validación en verde y el informe con la salida real de cada comando.
