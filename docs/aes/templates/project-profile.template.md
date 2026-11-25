# Project Profile — [Nombre del proyecto]

- **AES version:** 1.2.0
- **Product owner / aprobador humano:** [rol/persona]
- **Repositorio:** [URL]
- **Ramas (07 §7):** `main` (liberado) y `dev` (integrado), ambas protegidas; ramas de trabajo cortas desde `dev`, hotfixes desde `main`
- **Release:** quién aprueba, cómo se marca la versión (p. ej. tag `vX.Y.Z`), dónde se publican las notas (`docs/releases/`)
- **Copia local de DoR/DoD:** [p. ej. `docs/aes/08-definition-of-ready-and-done.md`, de AES 1.2.0]

## Roles: harness y modelo
El modelo real de cada ejecución se registra en las métricas (09 §6); si difiere de esta tabla, se anota.

| Rol | Harness | Modelo | Invocación | Identidad con la que publica | Proveedor y condiciones de datos (06 §12) |
|---|---|---|---|---|---|
| Orquestador (modelo más capaz disponible, 06 §11) | | | | | |
| QA | | | | | |
| Programador | | | | | |
| Mecánico (opcional) | | | | | |
| Verificador (otra familia de modelos que el programador, 06 §12) | | | | | |

Ejemplo de la implementación de referencia: orquestador en Claude Code (Opus); QA, programador y mecánico en OpenCode con `deepseek/deepseek-flash`, delegados con `.claude/scripts/aes-oc.sh` (binding en `.claude/aes.env`); verificador como subagente de Claude Code (Sonnet).

### Niveles de modelo por tarea (06 §12.1)
| Nivel | Cuándo se usa | Programador | Verificador | Proveedor y condiciones de datos |
|---|---|---|---|---|
| estándar | Por defecto | [binding] | [binding] | |
| alto | [contexto muy grande, razonamiento que cruza muchas piezas, dos ciclos FAIL por defectos del código] | [binding] | [binding] | |

[Si en un nivel programador y verificador quedan en la misma familia de modelos, anotarlo aquí como hueco.]

Huecos de control de los roles en otro harness (06 §12, punto 3):

## Producto y contexto
- Objetivo:
- Usuarios:
- Restricciones:
- Entornos:

## Stack
- Lenguaje y versión:
- Framework y versión:
- Base de datos:
- Infraestructura/despliegue:
- Integraciones:

## Arquitectura y convenciones
- Directorios/módulos importantes:
- Patrones existentes que deben respetarse:
- Contratos y APIs:
- ADRs:
- Reglas de compatibilidad:

## Backlog
- Herramienta / ubicación: `docs/backlog.md` (02 §11)
- Releases: definidos en la incepción (01 §2, 02 §12)
- Prefijos de ID: historias `US-`, enablers `EN-`, defectos `BUG-`, chores `CH-`, lotes `ST-`, spikes `SP-`
- Escala de prioridad:
- Escala de Story Points: Fibonacci 1, 2, 3, 5, 8, 13
- Estados:
- Criterios propios para clasificar tracks T0–T3 (si difieren de 02 §8):

## Skills y herramientas (06 §6.2)
| Skill / herramienta | Tipo (técnica / herramienta) | Origen y versión | Licencia | Revisada por | Roles |
|---|---|---|---|---|---|
| aes-debugging | Técnica | AES vX.Y.Z | | | Programador, mecánico |
| aes-inception | Técnica | AES vX.Y.Z | | | Orquestador |
| impeccable (opcional) | Técnica + herramienta | vX.Y.Z (`docs/aes/skills.lock`) | Apache-2.0 | | Orquestador, programador, verificador |
| archify (opcional) | Herramienta | vX.Y.Z (`docs/aes/skills.lock`) | MIT | | Orquestador |

- Análisis estático de seguridad en la CI (05 §7): herramienta, reglas y qué severidad bloquea:
- Detector de interfaz en la CI (05 §7): herramienta, y qué reglas bloquean (al principio, ninguna: solo anota):
- Consultas de red que una skill no permite desactivar (06 §6.2): cuál, qué envía, cuándo se usa:

## Diseño (10)
- Catálogo de diseño: `docs/design-catalog.md`
- Herramienta del resumen estructural (archivos y firmas públicas):
- Reglas del nivel 1 cubiertas por linters en la CI (herramienta y regla):
- Excepciones documentadas al nivel 1:

## Defectos y compuerta de estabilización (02 §9)
- Escala de severidad: Crítica / Alta / Media / Menor (ajustes propios, si los hay):
- Límite de defectos Menores abiertos (por defecto 5):
- Dónde se implementa la compuerta (CI, L3):
- Regla permanente para hallazgos tras un PASS del verificador (02 §9.3), p. ej. «lo que añade la tarea se corrige antes de integrar; lo demás va al backlog con severidad»:
- Corridas sin fallo exigidas para dar por estable una prueba corregida (05 §6):

## Calidad y pruebas
- Unit tests (comando):
- Integration tests (comando):
- E2E / aceptación (comando, con filtro por historia):
- Lint / formato:
- Tipos / análisis estático:
- Seguridad / dependencias:
- Umbrales justificados:
- Generación del test map (herramienta o método):
- Proporción de pruebas holdout:
- Presupuesto de diff orientativo por tarea (producción / pruebas):
- Herramienta de prueba manual agéntica (Playwright, curl, etc.):
- Herramienta que arranca y detiene servidores (06 §10) y puertos del proyecto:
- Herramienta que comprueba el RED (05 §2.2):
- Comandos de verificación por elemento (05 §12): ubicación y convención:
- Política de auditoría de dependencias (p. ej. `npm audit`, `dotnet list package --vulnerable`):

## Controles en capas (06 §9)
| Control | L1 — Harness | L2 — Hooks | L3 — Fuera del agente |
|---|---|---|---|
| Suite de aceptación protegida | | | |
| Pruebas holdout inaccesibles | | | |
| Superficie de cambio | | | |
| Configuración de agentes/CI protegida | | | |
| No terminar con pruebas rojas | | | |
| Detector de trampas | | | |
| RED confirmado por herramienta | | | |
| CI por criterio y por fase | | | |
| Compuerta de estabilización | | | |
| Aprobaciones en la CI validan quién (etiquetas) | | | |
| PASS del verificador antes de integrar | | | |
| Sin servidores ni procesos entre roles | | | |
| Acciones denegadas no se delegan | | | |
| Escrituras fuera del repositorio (aislamiento) | | | |

## Permisos y operación de agentes
- Rutas editables por programador:
- Rutas protegidas:
- Ubicación de las pruebas holdout:
- Operaciones que requieren aprobación:
- MCP/CLI expuestos:
- Skills instaladas y su origen:
- Gestión de secretos:
- Estrategia de ramas/worktrees:
- Umbral del circuit breaker (≤ 3):
- Notas del orquestador durante el ciclo (ubicación y script):

## Riesgo y liberación
- Clasificación de riesgo:
- Controles High/Critical (T3):
- Migraciones/rollback:
- Aprobación de despliegue:

## Mejora del harness
- Ubicación del registro de fallos: `docs/agent-failure-log.md`
- Ubicación del registro de hallazgos y métricas: `docs/harness-findings.md`
- Frecuencia de retrospectiva compuesta:

## Excepciones AES
| Regla | Motivo | Riesgo | Mitigación | Aprobador | Revisión/expiración |
|---|---|---|---|---|---|
