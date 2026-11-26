import { request as playwrightRequest, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, BASE_URL } from '../fixtures/app';

// Etiquetas WCAG 2.2 AA acordadas en el contrato de EN-001 (AC-05).
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Textos del contrato de interfaz de US-001 (specs/US-001/plan.md).
const USER_ERROR =
  'El usuario debe tener de 3 a 32 caracteres: letras sin acento, números, punto, guion bajo o guion.';
const PASSWORD_ERROR = 'La contraseña debe tener de 12 a 128 caracteres.';
const REPEAT_ERROR = 'Las contraseñas no coinciden.';
const FAILURE_ALERT = 'No se pudo crear la cuenta. Intentar de nuevo.';

const VALID_USERNAME = 'Keylor';
const VALID_PASSWORD = 'Una frase larga 123';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function describeViolations(violations: { id: string; help: string; nodes: unknown[] }[]): string {
  return violations
    .map((v) => `${v.id} (${v.nodes.length} nodo(s)): ${v.help}`)
    .join('\n');
}

/** Cliente HTTP sin cookies de sesión: simula a quien llega sin sesión iniciada. */
function newApiContext() {
  return playwrightRequest.newContext({ baseURL: BASE_URL });
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
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
}

/** Lleva el foco al control con Tab, como el dueño que navega solo con el teclado. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let press = 0; press < 15; press += 1) {
    const focused = await target.evaluate((el) => el === document.activeElement);
    if (focused) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

function usernameField(page: Page) {
  return page.getByLabel('Usuario', { exact: true });
}
function passwordField(page: Page) {
  return page.getByLabel('Contraseña', { exact: true });
}
function repeatField(page: Page) {
  return page.getByLabel('Repetir la contraseña', { exact: true });
}
function createButton(page: Page) {
  return page.getByRole('button', { name: 'Crear cuenta', exact: true });
}
function showPasswordButton(page: Page) {
  return page.getByRole('button', { name: 'Mostrar contraseña', exact: true });
}
function hidePasswordButton(page: Page) {
  return page.getByRole('button', { name: 'Ocultar contraseña', exact: true });
}

async function fillForm(
  page: Page,
  values: { username: string; password: string; repeat: string },
): Promise<void> {
  await usernameField(page).fill(values.username);
  await passwordField(page).fill(values.password);
  await repeatField(page).fill(values.repeat);
}

test(
  'AC-01 sin cuenta, la app muestra «Crear la cuenta» con sus campos, el botón de mostrar, el indicador de largo («Faltan 12 caracteres» desde vacío) y «Crear cuenta»',
  { tag: ['@US-001', '@US-001-AC-01'] },
  async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();
    await expect(usernameField(page)).toBeVisible();
    await expect(passwordField(page)).toBeVisible();
    await expect(repeatField(page)).toBeVisible();
    await expect(showPasswordButton(page)).toBeVisible();
    await expect(createButton(page)).toBeVisible();

    // D-05: el indicador de largo se ve desde que la pantalla se abre; con el campo
    // de contraseña vacío dice que faltan los 12 caracteres del mínimo.
    await expect(page.getByText('Faltan 12 caracteres', { exact: true }).first()).toBeVisible();

    // Y se actualiza mientras se escribe.
    await passwordField(page).fill('a');
    await expect(page.getByText('Faltan 11 caracteres', { exact: true }).first()).toBeVisible();
  },
);

test(
  'AC-02 con un usuario y una contraseña válidos se crea la cuenta, el dueño entra con su sesión, ve el usuario en minúsculas y sigue dentro al recargar',
  { tag: ['@US-001', '@US-001-AC-02'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    await fillForm(page, {
      username: VALID_USERNAME,
      password: VALID_PASSWORD,
      repeat: VALID_PASSWORD,
    });
    await createButton(page).click();

    await expect(page.getByText('Sesión iniciada como keylor', { exact: true })).toBeVisible();
    await expect(createButton(page)).toBeHidden();

    // La sesión del navegador también responde por la API del contrato.
    const session = await page.request.get('/api/session');
    expect(session.status()).toBe(200);
    expect(await session.json()).toEqual({ accountExists: true, username: 'keylor' });

    await page.reload();
    await expect(page.getByText('Sesión iniciada como keylor', { exact: true })).toBeVisible();
  },
);

test(
  'AC-02 con el usuario mínimo (3 caracteres) y la contraseña mínima (12) se crea la cuenta',
  { tag: ['@US-001', '@US-001-AC-02'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    await fillForm(page, {
      username: 'abc',
      password: '123456789012',
      repeat: '123456789012',
    });
    await createButton(page).click();

    await expect(page.getByText('Sesión iniciada como abc', { exact: true })).toBeVisible();
  },
);

test(
  'AC-02 con el usuario máximo (32 caracteres) y la contraseña máxima (128) se crea la cuenta',
  { tag: ['@US-001', '@US-001-AC-02'] },
  async ({ page }) => {
    const username = 'u'.repeat(32);
    const password = 'p'.repeat(128);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    await fillForm(page, { username, password, repeat: password });
    await createButton(page).click();

    await expect(page.getByText(`Sesión iniciada como ${username}`, { exact: true })).toBeVisible();
  },
);

test(
  'AC-02 una contraseña de 12 caracteres Unicode (emojis) es válida: se cuentan puntos de código, no bytes',
  { tag: ['@US-001', '@US-001-AC-02'] },
  async ({ page }) => {
    const password = '😀'.repeat(12); // 12 puntos de código, 24 unidades UTF-16

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    await fillForm(page, { username: 'unicode', password, repeat: password });
    await createButton(page).click();

    await expect(page.getByText('Sesión iniciada como unicode', { exact: true })).toBeVisible();
  },
);

test(
  'AC-03 con datos inválidos no se crea la cuenta, cada campo con problema muestra qué corregir y lo escrito se conserva',
  { tag: ['@US-001', '@US-001-AC-03'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    const user = usernameField(page);
    const password = passwordField(page);
    const repeat = repeatField(page);

    // Usuario de 2 caracteres, contraseña de 11 y repetición distinta: los tres errores.
    await fillForm(page, { username: 'ab', password: '12345678901', repeat: '12345678902' });
    await createButton(page).click();

    const userError = page.getByText(USER_ERROR, { exact: true });
    const passwordError = page.getByText(PASSWORD_ERROR, { exact: true });
    const repeatError = page.getByText(REPEAT_ERROR, { exact: true });

    await expect(userError.first()).toBeVisible();
    await expect(passwordError.first()).toBeVisible();
    await expect(repeatError.first()).toBeVisible();

    // Los errores están asociados a su campo (descripción accesible).
    await expect(user).toHaveAccessibleDescription(new RegExp(escapeRegExp(USER_ERROR)));
    await expect(password).toHaveAccessibleDescription(new RegExp(escapeRegExp(PASSWORD_ERROR)));
    await expect(repeat).toHaveAccessibleDescription(new RegExp(escapeRegExp(REPEAT_ERROR)));

    // Y lo escrito se conserva.
    await expect(user).toHaveValue('ab');
    await expect(password).toHaveValue('12345678901');
    await expect(repeat).toHaveValue('12345678902');

    // Usuario de 33 caracteres: fuera del máximo.
    await fillForm(page, {
      username: 'a'.repeat(33),
      password: '123456789012',
      repeat: '123456789012',
    });
    await createButton(page).click();
    await expect(userError.first()).toBeVisible();
    await expect(passwordError).toBeHidden();
    await expect(repeatError).toBeHidden();

    // Usuario con un espacio: fuera de las reglas.
    await fillForm(page, {
      username: 'con espacio',
      password: '123456789012',
      repeat: '123456789012',
    });
    await createButton(page).click();
    await expect(userError.first()).toBeVisible();

    // Usuario con acento: las letras tienen que ser sin acento.
    await fillForm(page, {
      username: 'josé',
      password: '123456789012',
      repeat: '123456789012',
    });
    await createButton(page).click();
    await expect(userError.first()).toBeVisible();

    // Contraseña de 129 caracteres: fuera del máximo.
    await fillForm(page, {
      username: 'valido_user',
      password: 'p'.repeat(129),
      repeat: 'p'.repeat(129),
    });
    await createButton(page).click();
    await expect(passwordError.first()).toBeVisible();
    await expect(userError).toBeHidden();
    await expect(repeatError).toBeHidden();

    // 11 emojis: 11 puntos de código Unicode, menos del mínimo de 12.
    await fillForm(page, {
      username: 'valido_user',
      password: '😀'.repeat(11),
      repeat: '😀'.repeat(11),
    });
    await createButton(page).click();
    await expect(passwordError.first()).toBeVisible();
    await expect(userError).toBeHidden();
    await expect(repeatError).toBeHidden();

    // Contraseñas distintas: solo el error de la repetición.
    await fillForm(page, {
      username: 'valido_user',
      password: '123456789012',
      repeat: '123456789013',
    });
    await createButton(page).click();
    await expect(repeatError.first()).toBeVisible();
    await expect(userError).toBeHidden();
    await expect(passwordError).toBeHidden();

    // Ningún intento creó la cuenta.
    const api = await newApiContext();
    try {
      const session = await api.get('/api/session');
      expect(session.status()).toBe(200);
      expect(await session.json()).toEqual({ accountExists: false, username: null });
    } finally {
      await api.dispose();
    }
  },
);

test(
  'AC-04 «Mostrar contraseña» muestra el texto y cambia a «Ocultar contraseña»; desde vacío el indicador dice «Faltan 12 caracteres», cuenta los que faltan y desaparece al llegar a 12',
  { tag: ['@US-001', '@US-001-AC-04'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    const password = passwordField(page);
    const repeat = repeatField(page);

    // D-05: con el campo de contraseña vacío, desde que se abre la pantalla, faltan 12.
    await expect(page.getByText('Faltan 12 caracteres', { exact: true }).first()).toBeVisible();

    // Mientras escribe, el indicador dice cuántos caracteres faltan.
    await password.fill('abcde');
    await expect(page.getByText('Faltan 7 caracteres', { exact: true }).first()).toBeVisible();

    // Un emoji es un carácter (punto de código): con uno faltan 11, no 10.
    await password.fill('😀');
    await expect(page.getByText('Faltan 11 caracteres', { exact: true }).first()).toBeVisible();

    await password.fill('abcdefghijk'); // 11 caracteres
    await expect(page.getByText('Falta 1 carácter', { exact: true }).first()).toBeVisible();

    await password.fill('abcdefghijkl'); // 12 caracteres
    await expect(page.getByText(/^Falta(?:n)? \d+ car(?:ácter|acteres)$/)).toHaveCount(0);

    // Mostrar: se ve el texto escrito y el botón cambia; afecta a los dos campos.
    await showPasswordButton(page).click();
    await expect(hidePasswordButton(page)).toBeVisible();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(repeat).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('abcdefghijkl');

    // Ocultar de nuevo.
    await hidePasswordButton(page).click();
    await expect(showPasswordButton(page)).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
  },
);

test(
  'AC-05 con la cuenta ya creada, quien abre la app sin sesión ve «La cuenta ya está creada.» sin formulario y no puede crear otra por la API',
  { tag: ['@US-001', '@US-001-AC-05'] },
  async ({ page }) => {
    // La cuenta existe, creada antes de que este navegador llegue.
    const owner = await newApiContext();
    try {
      const created = await owner.post('/api/account', {
        data: { username: 'dueno.original', password: VALID_PASSWORD },
      });
      expect(created.status()).toBe(201);
    } finally {
      await owner.dispose();
    }

    await page.goto('/');
    await expect(page.getByText('La cuenta ya está creada.', { exact: true })).toBeVisible();
    await expect(createButton(page)).toBeHidden();
    await expect(usernameField(page)).toBeHidden();

    // «Por cualquier camino»: otro intento directo contra la API.
    const intruder = await newApiContext();
    try {
      const second = await intruder.post('/api/account', {
        data: { username: 'otro.intento', password: VALID_PASSWORD },
      });
      expect(second.status()).toBe(409);
      expect((await second.json()).error?.code).toBe('account_exists');

      // La cuenta existente sigue ahí y este cliente (sin sesión) no recibe su usuario.
      const session = await intruder.get('/api/session');
      expect(session.status()).toBe(200);
      expect(await session.json()).toEqual({ accountExists: true, username: null });
    } finally {
      await intruder.dispose();
    }

    // El estado de la pantalla no cambia tampoco al recargar.
    await page.reload();
    await expect(page.getByText('La cuenta ya está creada.', { exact: true })).toBeVisible();
  },
);

test(
  'AC-05 dos peticiones simultáneas con la base vacía crean una sola cuenta: una recibe 201 y la otra 409',
  { tag: ['@US-001', '@US-001-AC-05'] },
  async () => {
    const first = await newApiContext();
    const second = await newApiContext();
    try {
      const [firstResponse, secondResponse] = await Promise.all([
        first.post('/api/account', {
          data: { username: 'primero', password: VALID_PASSWORD },
        }),
        second.post('/api/account', {
          data: { username: 'segundo', password: VALID_PASSWORD },
        }),
      ]);

      const statuses = [firstResponse.status(), secondResponse.status()].sort((a, b) => a - b);
      expect(statuses).toEqual([201, 409]);

      const winner = firstResponse.status() === 201 ? firstResponse : secondResponse;
      const created = await winner.json();
      expect(['primero', 'segundo']).toContain(created.username);

      // Una tercera petición tampoco puede crear otra cuenta.
      const third = await newApiContext();
      try {
        const thirdResponse = await third.post('/api/account', {
          data: { username: 'tercero', password: VALID_PASSWORD },
        });
        expect(thirdResponse.status()).toBe(409);
        expect((await thirdResponse.json()).error?.code).toBe('account_exists');

        const session = await third.get('/api/session');
        expect(await session.json()).toEqual({ accountExists: true, username: null });
      } finally {
        await third.dispose();
      }
    } finally {
      await first.dispose();
      await second.dispose();
    }
  },
);

test(
  'AC-05 si la cuenta se crea mientras se llena el formulario, al pulsar «Crear cuenta» se ve «La cuenta ya está creada.» sin formulario',
  { tag: ['@US-001', '@US-001-AC-05'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();
    await fillForm(page, {
      username: VALID_USERNAME,
      password: VALID_PASSWORD,
      repeat: VALID_PASSWORD,
    });

    // Alguien creó la cuenta entre la carga de la pantalla y el envío: el servidor
    // responde 409 (contrato de POST /api/account).
    await page.route('**/api/account', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'account_exists', message: 'La cuenta ya está creada.' },
        }),
      }),
    );
    await createButton(page).click();

    await expect(page.getByText('La cuenta ya está creada.', { exact: true })).toBeVisible();
    await expect(createButton(page)).toBeHidden();
    await expect(usernameField(page)).toBeHidden();
  },
);

test(
  'AC-06 si el servidor falla, se ve «No se pudo crear la cuenta. Intentar de nuevo.», lo escrito se conserva, no queda cuenta a medias y al reintentar se crea',
  { tag: ['@US-001', '@US-001-AC-06'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();
    await fillForm(page, {
      username: VALID_USERNAME,
      password: VALID_PASSWORD,
      repeat: VALID_PASSWORD,
    });

    // El servidor falla al crear (503).
    await page.route('**/api/account', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'database_unavailable', message: 'La base de datos no está disponible.' },
        }),
      }),
    );
    await createButton(page).click();

    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(FAILURE_ALERT);
    await expect(usernameField(page)).toHaveValue(VALID_USERNAME);
    await expect(passwordField(page)).toHaveValue(VALID_PASSWORD);
    await expect(repeatField(page)).toHaveValue(VALID_PASSWORD);

    // No queda ninguna cuenta a medias (el cliente que consulta no tiene sesión).
    const api = await newApiContext();
    try {
      const session = await api.get('/api/session');
      expect(await session.json()).toEqual({ accountExists: false, username: null });
    } finally {
      await api.dispose();
    }

    // Sin conexión: el mismo aviso, sin perder lo escrito.
    await page.unroute('**/api/account');
    await page.route('**/api/account', (route) => route.abort('failed'));
    await createButton(page).click();
    await expect(page.getByRole('alert')).toHaveText(FAILURE_ALERT);
    await expect(usernameField(page)).toHaveValue(VALID_USERNAME);
    await expect(passwordField(page)).toHaveValue(VALID_PASSWORD);

    // Con el servidor disponible, al volver a pulsar el aviso desaparece y la cuenta se crea.
    await page.unroute('**/api/account');
    await createButton(page).click();
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(page.getByText('Sesión iniciada como keylor', { exact: true })).toBeVisible();
  },
);

test(
  'AC-08 en escritorio la pantalla vacía y con errores no tiene incumplimientos WCAG 2.2 AA',
  { tag: ['@US-001', '@US-001-AC-08'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    const empty = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(empty.violations, describeViolations(empty.violations)).toEqual([]);

    await fillForm(page, { username: 'ab', password: '12345678901', repeat: '12345678902' });
    await createButton(page).click();
    await expect(page.getByText(USER_ERROR, { exact: true }).first()).toBeVisible();

    const withErrors = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(withErrors.violations, describeViolations(withErrors.violations)).toEqual([]);
  },
);

test(
  'AC-08 en un celular de 360 px la pantalla vacía, con errores y con el aviso de fallo no tiene incumplimientos WCAG 2.2 AA ni desplazamiento horizontal',
  { tag: ['@US-001', '@US-001-AC-08'] },
  async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    await expectNoHorizontalScroll(page);
    const empty = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(empty.violations, describeViolations(empty.violations)).toEqual([]);

    // Con errores.
    await fillForm(page, { username: 'ab', password: '12345678901', repeat: '12345678902' });
    await createButton(page).click();
    await expect(page.getByText(USER_ERROR, { exact: true }).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
    const withErrors = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(withErrors.violations, describeViolations(withErrors.violations)).toEqual([]);

    // Con el aviso de fallo de AC-06.
    await page.route('**/api/account', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'database_unavailable', message: 'La base de datos no está disponible.' },
        }),
      }),
    );
    await fillForm(page, {
      username: VALID_USERNAME,
      password: VALID_PASSWORD,
      repeat: VALID_PASSWORD,
    });
    await createButton(page).click();
    await expect(page.getByRole('alert')).toHaveText(FAILURE_ALERT);
    await expectNoHorizontalScroll(page);
    const withAlert = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
    expect(withAlert.violations, describeViolations(withAlert.violations)).toEqual([]);
  },
);

test(
  'AC-08 todo el alta de la cuenta se puede hacer solo con el teclado',
  { tag: ['@US-001', '@US-001-AC-08'] },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Crear la cuenta' })).toBeVisible();

    // Alta incompleta (contraseña corta) solo con el teclado: aparece el error.
    await tabTo(page, usernameField(page));
    await page.keyboard.type(VALID_USERNAME);

    await tabTo(page, passwordField(page));
    await page.keyboard.type('abcde');

    await tabTo(page, repeatField(page));
    await page.keyboard.type('abcde');

    // Mostrar y ocultar la contraseña también con el teclado.
    await tabTo(page, showPasswordButton(page));
    await page.keyboard.press('Enter');
    await expect(hidePasswordButton(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(showPasswordButton(page)).toBeVisible();

    await tabTo(page, createButton(page));
    await page.keyboard.press('Enter');
    await expect(page.getByText(PASSWORD_ERROR, { exact: true }).first()).toBeVisible();

    // Corregir y terminar el alta solo con el teclado.
    await tabTo(page, passwordField(page));
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(VALID_PASSWORD);

    await tabTo(page, repeatField(page));
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(VALID_PASSWORD);

    await tabTo(page, createButton(page));
    await page.keyboard.press('Enter');

    await expect(page.getByText('Sesión iniciada como keylor', { exact: true })).toBeVisible();
  },
);
