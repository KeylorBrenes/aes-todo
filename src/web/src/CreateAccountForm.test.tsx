import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateAccountForm } from './CreateAccountForm';
import { texts } from './i18n/es';

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

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(texts.usernameLabel), 'Ana');
  await user.type(screen.getByLabelText(texts.passwordLabel), 'una frase larga y secreta');
  await user.type(screen.getByLabelText(texts.repeatPasswordLabel), 'una frase larga y secreta');
}

describe('CreateAccountForm', () => {
  it('muestra el encabezado, los tres campos con etiqueta y «Crear cuenta»', () => {
    renderForm();

    expect(screen.getByRole('heading', { name: texts.createAccountHeading })).toBeVisible();
    expect(screen.getByLabelText(texts.usernameLabel)).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText(texts.usernameLabel)).toHaveAttribute('autocapitalize', 'none');
    expect(screen.getByLabelText(texts.usernameLabel)).toHaveAttribute('spellcheck', 'false');
    expect(screen.getByLabelText(texts.passwordLabel)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(texts.passwordLabel)).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText(texts.repeatPasswordLabel)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: texts.createAccountButton })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('envía lo escrito tal cual y avisa con el usuario devuelto al crearse', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ username: 'ana' }, 201)));
    vi.stubGlobal('fetch', fetchMock);
    const { onCreated, onExists } = renderForm();
    const user = userEvent.setup();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: texts.createAccountButton }));

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

    await user.click(screen.getByRole('button', { name: texts.createAccountButton }));

    await waitFor(() => {
      expect(onExists).toHaveBeenCalledTimes(1);
    });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('no hace nada con un resultado «invalid» o «failed»', async () => {
    const responses = [
      jsonResponse({ error: { code: 'validation_failed', fields: { username: 'invalid' } } }, 400),
      jsonResponse({ error: { code: 'internal', message: 'm' } }, 500),
    ];
    const fetchMock = vi.fn(() => Promise.resolve(responses.shift() as Response));
    vi.stubGlobal('fetch', fetchMock);
    const { onCreated, onExists } = renderForm();
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: texts.createAccountButton });

    await user.click(button);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await user.click(button);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(onCreated).not.toHaveBeenCalled();
    expect(onExists).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: texts.createAccountHeading })).toBeVisible();
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
    const button = screen.getByRole('button', { name: texts.createAccountButton });

    await user.click(button);
    await user.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button).toBeEnabled();
    expect(button).toHaveFocus();

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
    const button = screen.getByRole('button', { name: texts.createAccountButton });

    await user.click(button);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await user.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
