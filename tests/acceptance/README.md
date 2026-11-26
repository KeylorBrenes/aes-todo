# Pruebas de aceptación

Pruebas de punta a punta con Playwright. Cada prueba se deriva de un criterio aprobado de
`specs/<ID>/<ID>.md` y habla con la app solo a través de su contrato de interfaz
(`specs/<ID>/plan.md`).

## Requisitos

Desde esta carpeta (`tests/acceptance`):

- Node.js y las dependencias: `npm ci`
- El navegador de Playwright: `npx playwright install chromium`
- Rust (`cargo`) y, si existe, la web compilada (`src/web`). El fixture arranca la app con
  `cargo run --locked --manifest-path src/server/Cargo.toml`.

## Ejecutar

```bash
npm test -- --grep "@EN-001(?![\w-])"
```

El fixture (`fixtures/app.ts`) arranca **un servidor por prueba** en `http://127.0.0.1:5080`
con `DATABASE_URL` apuntando a un archivo inexistente en una carpeta temporal, `APP_ADDR` y
`WEB_DIST` como define el contrato de EN-001. Si la web existe (`src/web/package.json`), la
compila antes. Al terminar cada prueba, detiene su servidor y borra su carpeta temporal.

Así cada prueba parte de una base vacía (sin cuenta), que es lo que exigen las pruebas de
US-001; la suite sigue corriendo con un solo worker en el puerto fijo. Las pruebas son
independientes en sus datos: ninguna depende de lo que cree otra ni compara totales globales.

## Etiquetas

- `@<ID>`: la del elemento (p. ej. `@EN-001`), la que usa la CI para ejecutar el elemento.
- `@<ID>-AC-NN`: la del criterio que demuestra la prueba.
- El título empieza por el ID del criterio (`AC-01 …`), como exige `ci/red-check.mjs`.
