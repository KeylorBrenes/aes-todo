---
name: aes-security-review
description: Revisión de seguridad estática (SAST, reglas OWASP/CWE) de lo que cambia una tarea AES. Úsala antes de entregar una tarea que toca entradas, autenticación, autorización, datos personales, consultas, archivos o secretos, cuando la CI marca un hallazgo de seguridad, o al clasificar hallazgos de seguridad como defectos.
---

# Revisión de seguridad estática (AES)

Skill de **herramienta** (AES 06 §6.2): el control es el paso de SAST de la CI (AES 05 §7). Esta skill sirve para ejecutarlo antes, entender los hallazgos y decidir qué hacer con cada uno. Herramienta de referencia: [Semgrep](https://semgrep.dev/) con reglas OWASP Top 10. El perfil puede usar otra equivalente.

## 1. Ejecutar sobre lo que cambia la tarea
```bash
base=$(bash .claude/scripts/aes-base.sh)          # origin/dev, u origin/main en un hotfix
semgrep scan --config p/owasp-top-ten --baseline-commit "$(git merge-base "$base" HEAD)" --metrics=off
```
`--baseline-commit` muestra solo los hallazgos **nuevos** respecto de la base. Sin él verías también los preexistentes, que no son de tu tarea.

## 2. Clasificar cada hallazgo
| Caso | Qué haces |
|---|---|
| **Verdadero, en código que añade o cambia la tarea** | Lo corriges dentro de la superficie. Si es de severidad alta, la CI fallará hasta corregirlo (ciclo `FAIL`) |
| **Verdadero, preexistente** (no lo introdujo la tarea) | No lo corriges: está fuera de tu tarea. Lo reportas con severidad propuesta para que el orquestador lo registre como defecto |
| **Falso positivo** | No lo suprimas tú: una supresión es un marcador del guardián y exige aprobación humana. Lo reportas con el motivo |

Un hallazgo es verdadero si el dato que llega a la instrucción peligrosa puede venir de fuera (petición, archivo, variable de entorno) sin pasar por una validación o un escape que lo neutralice. Sigue el dato hacia atrás hasta su origen antes de decidir.

## 3. Severidad propuesta (AES 02 §9.1)
| Semgrep | Severidad AES propuesta |
|---|---|
| `ERROR` alcanzable desde fuera, que expone datos, permite ejecutar código o salta la autenticación o autorización | **Crítica** |
| `ERROR` | **Alta** |
| `WARNING` | **Media** |
| `INFO` | **Menor** |

Es una propuesta: el orquestador la presenta y el humano la confirma.

## 4. Correcciones habituales (sin inventar mecanismos propios)
- **Inyección** (SQL, comandos, rutas): consultas parametrizadas o el ORM; nunca concatenar entradas en una consulta, un comando o una ruta.
- **XSS:** dejar que el framework escape; no usar `dangerouslySetInnerHTML`, `innerHTML` ni `Html.Raw` con datos de entrada.
- **Secretos:** fuera del código, en la configuración del entorno (nivel 1, AES 10 §3).
- **Autorización:** se comprueba en el servidor, en cada operación sobre un recurso, no solo en la UI.
- **Criptografía:** las primitivas del framework o de una biblioteca establecida; nunca una propia.

## En el reporte
Comando ejecutado y su salida real, y una tabla de hallazgos: regla, archivo y línea, verdadero o falso, de la tarea o preexistente, severidad propuesta y qué hiciste.
