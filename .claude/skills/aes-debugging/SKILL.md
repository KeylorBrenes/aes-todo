---
name: aes-debugging
description: Depuración por causa raíz dentro de AES. Úsala ante cualquier fallo antes de proponer un arreglo — prueba roja, CI roja, ciclo FAIL del verificador, defecto (BUG-NNN), prueba inestable o comportamiento inesperado — aunque parezca simple.
---

# Depuración por causa raíz (AES)

Técnica para el programador (y el mecánico) en ciclos `FAIL` y defectos, y para el orquestador al clasificar un fallo. Basada en `systematic-debugging` de [obra/superpowers](https://github.com/obra/superpowers) (MIT), adaptada a los gates de AES.

## Regla
**Ningún arreglo sin causa raíz.** Un cambio que hace desaparecer el síntoma sin explicar por qué ocurría no es un arreglo: es un ciclo `FAIL` aplazado.

## 1. Reproducir con evidencia
- Lee el error **completo**: mensaje, traza, salida de la CI. No un resumen.
- Reprodúcelo con un comando. Si es un defecto, la reproducción ya existe: es la comprobación con RED del elemento (prueba o `.verify`). Si es un fallo de tu tarea, escribe primero la prueba técnica que falla por esa razón.
- Si no se reproduce de forma consistente, no adivines: reúne más datos (más corridas, más contexto) y dilo en tu reporte.

## 2. Investigar
- **Qué cambió:** `git log` y `git diff` contra la base de la rama; dependencias, configuración, entorno.
- **Hacia atrás:** sigue el valor incorrecto hasta su origen, no hasta donde explota.
- **En las fronteras:** si hay varios componentes (UI → API → base de datos), mira qué entra y qué sale de cada uno hasta encontrar dónde se rompe. Si añades registros de diagnóstico, son temporales: no llegan al commit.
- **Compara con lo que funciona:** busca código parecido del mismo proyecto que sí funciona y lista las diferencias.

## 3. Una hipótesis a la vez
- Escribe la hipótesis: «la causa es X porque Y».
- Compruébala con el cambio más pequeño posible, una variable a la vez.
- Si falla, descártala y formula otra. No acumules cambios.

## 4. Arreglar
- El arreglo ataca la causa raíz, en un solo cambio, **dentro de la superficie de la tarea**. Si la causa está fuera de la superficie o en una prueba protegida, detente: `BLOCKED`, con la causa y la evidencia.
- La reproducción del paso 1 pasa de roja a verde, y el resto de las validaciones siguen en verde.
- Nada de cambios «de paso», ni de silenciar el error (`catch` vacío, reintentos sin causa, aserciones debilitadas).

## 5. Cuándo parar
- Si dos hipótesis seguidas fallan, o el arreglo exige tocar varias piezas que no deberían estar relacionadas, **detente** y repórtalo: puede ser un problema de diseño, y eso lo decide el orquestador (nota de diseño) o el humano. No pruebes «una cosa más».
- Cada intento que llega a la CI o al verificador cuenta para el circuit breaker de la tarea (3 ciclos `FAIL`, AES 04 §9).

## Pruebas inestables
- Una prueba que falla a veces tiene una causa: orden, datos compartidos, tiempo, estado que dejó otra prueba. Búscala igual que cualquier otra.
- No se arregla con esperas fijas (`sleep`): se espera a la **condición** (un elemento visible, una respuesta, un archivo).
- Si la prueba es de aceptación, es protegida: el programador no la toca. Repórtala como defecto; la corrige QA (AES 05 §6).

## Señales de que te saltaste el proceso
«Pruebo cambiando X a ver qué pasa», «seguro es Y», «un intento más», arreglar sin haber visto el error fallar. Vuelve al paso 1.

## En el reporte
Síntoma, reproducción (comando y salida), causa raíz y evidencia, arreglo, y la reproducción en verde. Si no encontraste la causa, dilo: qué investigaste, qué descartaste y qué falta.
