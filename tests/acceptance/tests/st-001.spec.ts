import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures/app';

// Pruebas del lote de estabilización ST-001. Solo usan el contrato de la pantalla
// (roles, textos y DESIGN.md): el aviso es role=alert, el estado es role=status y el
// control del reintento es el botón "Reintentar".

type FocusPaint = {
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  boxShadow: string;
};

/** Estilos con los que el navegador dibuja el foco de un elemento. */
async function focusPaint(locator: Locator): Promise<FocusPaint> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });
}

/** Color resuelto de `--action` de DESIGN.md (el token del anillo de foco). */
async function actionColor(page: Page): Promise<string> {
  const { raw, resolved } = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const raw = root.getPropertyValue('--action').trim();
    const probe = document.createElement('span');
    probe.style.color = raw || 'rgb(1, 1, 1)';
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return { raw, resolved };
  });
  expect(raw, 'DESIGN.md define el token --action en :root').not.toBe('');
  return resolved;
}

function hasActionRing(paint: FocusPaint, action: string): boolean {
  const outline =
    paint.outlineStyle !== 'none' &&
    parseFloat(paint.outlineWidth) === 3 &&
    paint.outlineColor === action;
  const shadow =
    paint.boxShadow !== 'none' &&
    paint.boxShadow.includes(action) &&
    paint.boxShadow.includes('3px');
  return outline || shadow;
}

function hasAnyRing(paint: FocusPaint): boolean {
  const outline = paint.outlineStyle !== 'none' && parseFloat(paint.outlineWidth) > 0;
  return outline || paint.boxShadow !== 'none';
}

/** Distancia vertical entre el título y el aviso o el texto de estado. */
async function titleGap(page: Page, target: 'alert' | 'status'): Promise<number> {
  const result = await page.evaluate((role) => {
    const heading = document.querySelector('h1');
    const element = document.querySelector(`[role="${role}"]`);
    if (!heading || !element) return null;
    const title = heading.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return {
      gap: Math.round((box.top - title.bottom) * 10) / 10,
      text: (element.textContent ?? '').trim(),
    };
  }, target);
  expect(result, `no se encontró el título o el elemento con role="${target}"`).not.toBeNull();
  return result!.gap;
}

/** Lleva el foco al control con Tab, como el dueño que navega con el teclado. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let press = 0; press < 10; press += 1) {
    const focused = await target.evaluate((el) => el === document.activeElement);
    if (focused) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

test(
  'BUG-001 el anillo de foco del estado, al navegar con teclado, es el de DESIGN.md (3 px de --action)',
  { tag: ['@ST-001', '@BUG-001'] },
  async ({ page }) => {
    await page.route('**/api/health', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    // El servidor vuelve: llegar a «Reintentar» con Tab y activarlo con Enter.
    await page.unroute('**/api/health');
    const retry = page.getByRole('button', { name: 'Reintentar', exact: true });
    await tabTo(page, retry);
    await page.keyboard.press('Enter');

    const status = page.getByRole('status');
    await expect(status).toHaveText('Conectado con el servidor');
    await expect(status).toBeFocused();

    const action = await actionColor(page);
    const paint = await focusPaint(status);
    expect(
      hasActionRing(paint, action),
      `el foco del estado debe dibujar 3 px de --action (${action}); se dibujó ${JSON.stringify(paint)}`,
    ).toBe(true);
  },
);

test(
  'BUG-002 tras reintentar con el ratón, el estado recibe el foco sin recuadro de foco',
  { tag: ['@ST-001', '@BUG-002'] },
  async ({ page }) => {
    await page.route('**/api/health', (route) => route.abort('failed'));
    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    await page.unroute('**/api/health');
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();

    const status = page.getByRole('status');
    await expect(status).toHaveText('Conectado con el servidor');

    // El foco no se pierde (WCAG 2.4.3)…
    await expect(status).toBeFocused();

    // …pero con el ratón no se dibuja recuadro de foco.
    const paint = await focusPaint(status);
    expect(
      hasAnyRing(paint),
      `con el ratón el estado no debe dibujar recuadro de foco; se dibujó ${JSON.stringify(paint)}`,
    ).toBe(false);
  },
);

test(
  'BUG-003 (1) la separación entre el título y el siguiente elemento es igual en conectando, conectado y sin conexión',
  { tag: ['@ST-001', '@BUG-003'] },
  async ({ page }) => {
    let release: (() => void) | undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let holding = false;
    await page.route('**/api/health', (route) => {
      if (!holding) return route.abort('failed');
      return hold.then(() => route.continue());
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');
    const offline = await titleGap(page, 'alert');

    holding = true;
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    const status = page.getByRole('status');
    await expect(status).toHaveText(/^Conectando/);
    const connecting = await titleGap(page, 'status');

    release!();
    await expect(status).toHaveText('Conectado con el servidor');
    const connected = await titleGap(page, 'status');

    const gaps = { offline, connecting, connected };
    const spread = Math.max(offline, connecting, connected) - Math.min(offline, connecting, connected);
    expect(
      spread,
      `la separación título→elemento debe ser la misma en los tres estados: ${JSON.stringify(gaps)}`,
    ).toBeLessThanOrEqual(1);
  },
);

test(
  'BUG-003 (2a) durante «Conectando…» el foco está en el estado y sigue ahí al conectar',
  { tag: ['@ST-001', '@BUG-003'] },
  async ({ page }) => {
    let release: (() => void) | undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let holding = false;
    await page.route('**/api/health', (route) => {
      if (!holding) return route.abort('failed');
      return hold.then(() => route.continue());
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    holding = true;
    const retry = page.getByRole('button', { name: 'Reintentar', exact: true });
    await tabTo(page, retry);
    await page.keyboard.press('Enter');

    const status = page.getByRole('status');
    await expect(status).toHaveText(/^Conectando/);
    await expect(status).toBeFocused();

    release!();
    await expect(status).toHaveText('Conectado con el servidor');
    await expect(status).toBeFocused();
  },
);

test(
  'BUG-003 (2b) si el reintento vuelve a fallar, el foco regresa a «Reintentar»',
  { tag: ['@ST-001', '@BUG-003'] },
  async ({ page }) => {
    let release: (() => void) | undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let holding = false;
    await page.route('**/api/health', (route) => {
      if (!holding) return route.abort('failed');
      return hold.then(() => route.abort('failed'));
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');

    holding = true;
    const retry = page.getByRole('button', { name: 'Reintentar', exact: true });
    await tabTo(page, retry);
    await page.keyboard.press('Enter');

    const status = page.getByRole('status');
    await expect(status).toHaveText(/^Conectando/);
    await expect(status).toBeFocused();

    release!();
    await expect(page.getByRole('alert')).toHaveText('No se pudo conectar con el servidor');
    await expect(retry).toBeFocused();
  },
);
