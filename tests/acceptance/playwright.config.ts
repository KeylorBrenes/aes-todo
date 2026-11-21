import { defineConfig, devices } from '@playwright/test';

// Un solo servidor por ejecución: la app (Axum) sirve la web y la API en el mismo origen.
// Las pruebas de EN-001 comparten ese servidor, pero cada una es independiente en sus datos
// (ninguna depende de datos creados por otra). Ver fixtures/app.ts.
export const BASE_URL = 'http://127.0.0.1:5080';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // Un único worker: todas las pruebas hablan con el mismo servidor en el puerto fijo 5080.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Margen para la primera compilación de Rust (el fixture arranca el servidor).
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
