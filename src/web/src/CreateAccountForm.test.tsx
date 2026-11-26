import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateAccountForm } from './CreateAccountForm';
import { texts } from './i18n/es';

const USER_ERROR =
  'El usuario debe tener de 3 a 32 caracteres: letras sin acento, números, punto, guion bajo o guion.';
const PASSWORD_ERROR = 'La contraseña debe tener de 12 a 128 caracteres.';
const REPEAT_ERROR = 'Las contraseñas no coinciden.';
const FAILURE_ALERT = 'No se pudo crear la cuenta. Intentar de nuevo.';
const SHOW_PASSWORD = 'Mostrar contraseña';
const HIDE_PASSWORD = 'Ocultar contraseña';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderForm() {
  const onCreated = vi.fn();
  const onExists = vi.fn();
  render(<CreateAccountForm onCreated={onCreated} onExists={onExists} />);
  return { onCreated, onExists };
}

function fields() {
  return {
    username: screen.getByLabelText(texts.usernameLabel),
    password: screen.getByLabelText(texts.passwordLabel),
    repeat: screen.getByLabelText(texts.repeatPasswordLabel),
  };
}

function createButton() {
  return screen.getByRole('button', { name: texts.createAccountButton });
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  const { username, password, repeat } = fields();
  await user.type(username, 'Ana');
  await user.type(password, 'una frase larga y secreta');
  await user.type(repeat, 'una frase larga y secreta');
}

describe('CreateAccountForm: la pantalla', () => {
  it('muestra el encabezado, los tres campos, el botón de mostrar, el indicador desde vacío y «Crear cuenta»', () => {
    renderForm();
    const { username, password, repeat } = fields();

    expect(screen.getByRole('heading', { name: texts.createAccountHeading })).toBeVisible();
    expect(username).toHaveAttribute('autocomplete', 'username');
    expect(username).toHaveAttribute('autocapitalize', 'none');
    expect(username).toHaveAttribute('spellcheck', 'false');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'new-password');
    expect(repeat).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: SHOW_PASSWORD })).toBeVisible();
    expect(screen.getByText('Faltan 12 caracteres')).toBeVisible();
    expect(createButton()).toHaveAttribute('type', 'submit');

    // Solo se describe lo que existe: el indicador, y ningún error todavía.
    expect(password).toHaveAttribute('aria-describedby', 'password-hint');
    expect(username).not.toHaveAttribute('aria-describedby');
    expect(repeat).not.toHaveAttribute('aria-describedby');
    expect(username).not.toHaveAttribute('aria-invalid');
  });

  it('actualiza el indicador al escribir y lo quita al llegar a 12 caracteres', async () => {
    renderForm();
    const user = userEvent.setup();
    const { password } = fields();

    await user.type(password, 'a');
    expect(screen.getByText('Faltan 11 caracteres')).toBeVisible();

    await user.clear(password);
    await user.type(password, 'abcdefghijk');
    expect(screen.getByText('Falta 1 carácter')).toBeVisible();

    await user.clear(password);
    await user.type(password, 'abcdefghijkl');
    expect(screen.queryByText(/^Falta(?:n)? \d+ car(?:ácter|acteres)$/)).not.toBeInTheDocument();
    expect(password).not.toHaveAttribute('aria-describedby');
  });

  it('muestra y oculta la contraseña en los dos campos sin desmontar el botón', async () => {
    renderForm();
    const user = userEvent.setup();
    const { password, repeat } = fields();
    const showButton = screen.getByRole('button', { name: SHOW_PASSWORD });

    await user.click(showButton);
    expect(password).toHaveAttribute('type', 'text');
    expect(repeat).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: HIDE_PASSWORD })).toBe(showButton);

    await user.click(showButton);
    expect(password).toHaveAttribute('type', 'password');
    expect(repeat).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: SHOW_PASSWORD })).toBe(showButton);
  });
});

describe('CreateAccountForm: envío', () => {
  it('envía lo escrito tal cual y avisa con el usuario devuelto al crearse', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ username: 'ana' }, 201)));
    vi.stubGlobal('fetch', fetchMock);
    const { onCreated, onExists } = renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(createButton());

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('ana');
    });
    expect(onExists).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      username: 'Ana',
      password: 'una frase larga y secreta',
    });
  });

  it('avisa con «onExists» cuando la cuenta ya existía', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(jsonResponse({ error: { code: 'account_exists', message: 'm' } }, 409)),
    );
    const { onCreated, onExists } = renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(createButton());

    await waitFor(() => {
      expect(onExists).toHaveBeenCalledTimes(1);
    });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('ignora un segundo envío mientras hay uno en curso y no deshabilita el botón', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal('fetch', fetchMock);
    const { onCreated } = renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(createButton());
    await user.click(createButton());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createButton()).toBeEnabled();
    expect(createButton()).toHaveFocus();

    resolveFetch(jsonResponse({ username: 'ana' }, 201));
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('permite un nuevo envío cuando el anterior terminó', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ error: { code: 'internal', message: 'm' } }, 500)),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(createButton());
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await user.click(createButton());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

describe('CreateAccountForm: errores del cliente', () => {
  it('con los tres errores no llama a la API, los muestra junto a cada campo y enfoca Usuario', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    const user = userEvent.setup();
    const { username, password, repeat } = fields();

    await user.type(username, 'ab');
    await user.type(password, '12345678901');
    await user.type(repeat, '12345678902');

    // No se valida mientras se escribe: los errores aparecen solo al pulsar «Crear cuenta».
    expect(screen.queryByText(USER_ERROR)).not.toBeInTheDocument();

    await user.click(createButton());

    expect(screen.getByText(USER_ERROR)).toBeVisible();
    expect(screen.getByText(PASSWORD_ERROR)).toBeVisible();
    expect(screen.getByText(REPEAT_ERROR)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(username).toHaveFocus();
    expect(username).toHaveValue('ab');
    expect(password).toHaveValue('12345678901');
    expect(repeat).toHaveValue('12345678902');

    expect(username).toHaveAttribute('aria-describedby', 'username-error');
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-describedby', 'password-hint password-error');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(repeat).toHaveAttribute('aria-describedby', 'repeat-error');
    expect(repeat).toHaveAttribute('aria-invalid', 'true');
  });

  it('con solo la repetición distinta muestra ese error y enfoca «Repetir la contraseña»', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    const user = userEvent.setup();
    const { username, password, repeat } = fields();

    await user.type(username, 'valido');
    await user.type(password, '123456789012');
    await user.type(repeat, '123456789013');
    await user.click(createButton());

    expect(screen.getByText(REPEAT_ERROR)).toBeVisible();
    expect(screen.queryByText(USER_ERROR)).not.toBeInTheDocument();
    expect(screen.queryByText(PASSWORD_ERROR)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(repeat).toHaveFocus();
    expect(username).not.toHaveAttribute('aria-invalid');
    expect(password).not.toHaveAttribute('aria-invalid');
  });

  it('mantiene los errores mientras se escribe y los limpia en el siguiente envío sin errores', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ username: 'ana' }, 201)));
    vi.stubGlobal('fetch', fetchMock);
    const { onCreated } = renderForm();
    const user = userEvent.setup();
    const { username, password, repeat } = fields();

    await user.type(username, 'ab');
    await user.type(password, 'corta');
    await user.type(repeat, 'corta');
    await user.click(createButton());
    expect(screen.getByText(USER_ERROR)).toBeVisible();

    await user.clear(username);
    await user.type(username, 'Ana');
    expect(screen.getByText(USER_ERROR)).toBeVisible();

    await user.clear(password);
    await user.type(password, 'una frase larga y secreta');
    await user.clear(repeat);
    await user.type(repeat, 'una frase larga y secreta');
    await user.click(createButton());

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('ana');
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('CreateAccountForm: resultados del servidor', () => {
  it('convierte los campos inválidos del servidor en errores y enfoca el primero', async () => {
    const responses = [
      jsonResponse({ error: { code: 'validation_failed', fields: { password: 'length' } } }, 400),
      jsonResponse({ error: { code: 'validation_failed', fields: { username: 'invalid' } } }, 400),
    ];
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(responses.shift() as Response)));
    renderForm();
    const user = userEvent.setup();
    const { username, password } = fields();

    await fillIn(user);
    await user.click(createButton());

    expect(await screen.findByText(PASSWORD_ERROR)).toBeVisible();
    expect(screen.queryByText(USER_ERROR)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(password).toHaveFocus();
    });

    await user.click(createButton());

    expect(await screen.findByText(USER_ERROR)).toBeVisible();
    expect(screen.queryByText(PASSWORD_ERROR)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(username).toHaveFocus();
    });
  });

  it('muestra el aviso al fallar y lo quita al completar el envío siguiente', async () => {
    const responses = [
      jsonResponse({ error: { code: 'internal', message: 'm' } }, 500),
      jsonResponse({ username: 'ana' }, 201),
    ];
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(responses.shift() as Response)));
    const { onCreated } = renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(createButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(FAILURE_ALERT);
    expect(onCreated).not.toHaveBeenCalled();
    expect(fields().username).toHaveValue('Ana');
    expect(fields().password).toHaveValue('una frase larga y secreta');
    expect(fields().repeat).toHaveValue('una frase larga y secreta');

    await user.click(createButton());

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('ana');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
