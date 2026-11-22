import { readFileSync, statSync, existsSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/app';

// Etiquetas WCAG 2.2 AA acordadas en el contrato de EN-001 (AC-05).
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function describeViolations(violations: { id: string; help: string; nodes: unknown[] }[]): string {
  return violations
    .map((v) => `${v.id} (${v.nodes.length} nodo(s)): ${v.help}`)
    .join('\n');
}

test(
  'AC-01 la app muestra el nombre y «Conectado con el servidor» al abrirla',
  { tag: ['@EN-001', '@EN-001-AC-01'] },
  async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('aes-todo');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1, name: 'aes-todo', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Conectado con el servidor');
  },
);

test(
  'AC-02 el primer arranque sin base de datos crea el archivo y responde que está bien',
  { tag: ['@EN-001', '@EN-001-AC-02'] },
  async ({ app, request }) => {
    // El fixture arrancó el servidor con DATABASE_URL apuntando a un archivo inexistente.
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });

    expect(existsSync(app.dbPath), `no se creó la base de datos en ${app.dbPath}`).toBe(true);
    expect(statSync(app.dbPath).size).toBeGreaterThan(0);
    const header = readFileSync(app.dbPath).subarray(0, 16).toString('latin1');
    expect(header).toBe('SQLite format 3\u0000');
  },
);

test(
  'AC-03 sin servidor, la app avisa «No se pudo conectar con el servidor» y ofrece «Reintentar»',
  { tag: ['@EN-001', '@EN-001-AC-03'] },
  async ({ page }) => {
    // Simula que el servidor no responde (contrato: AC-03/AC-04 interceptan /api/health).
    await page.route('**/api/health', (route) => route.abort('failed'));
    await page.goto('/');

    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');
    await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeVisible();
    await expect(page.getByText('Conectado con el servidor')).toHaveCount(0);
  },
);

test(
  'AC-04 al volver el servidor, «Reintentar» quita el aviso y muestra «Conectado con el servidor»',
  { tag: ['@EN-001', '@EN-001-AC-04'] },
  async ({ page }) => {
    await page.route('**/api/health', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    // El servidor vuelve a responder: la siguiente llamada llega a la app real.
    await page.unroute('**/api/health');
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();

    await expect(page.getByRole('status')).toHaveText('Conectado con el servidor');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toHaveCount(0);
  },
);

test(
  'AC-05 la pantalla, conectada o con el aviso, no tiene incumplimientos WCAG 2.2 AA',
  { tag: ['@EN-001', '@EN-001-AC-05'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('Conectado con el servidor');

    const connected = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(connected.violations, describeViolations(connected.violations)).toEqual([]);

    await page.route('**/api/health', (route) => route.abort('failed'));
    await page.reload();
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    const offline = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(offline.violations, describeViolations(offline.violations)).toEqual([]);
  },
);

test(
  'AC-06 en un celular de 360 px la pantalla se ve completa, sin desplazamiento horizontal',
  { tag: ['@EN-001', '@EN-001-AC-06'] },
  async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'aes-todo', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Conectado con el servidor');

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));

    expect(widths.document, `scrollWidth ${widths.document} > viewport ${widths.viewport}`).toBeLessThanOrEqual(
      widths.viewport,
    );
    expect(widths.body, `body.scrollWidth ${widths.body} > viewport ${widths.viewport}`).toBeLessThanOrEqual(
      widths.viewport,
    );
  },
);
