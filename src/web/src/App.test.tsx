import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { texts } from './i18n/es';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Routes = {
  health?: () => Promise<Response>;
  session?: () => Promise<Response>;
  account?: () => Promise<Response>;
};

const healthyResponse = () => Promise.resolve(jsonResponse({ status: 'ok' }));
const noAccountResponse = () =>
  Promise.resolve(jsonResponse({ accountExists: false, username: null }));

/** Servidor simulado: cada ruta de la API responde con su propio manejador. */
function stubServer(routes: Routes = {}) {
  const mock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);

    if (url === '/api/health') {
      return (routes.health ?? healthyResponse)();
    }
    if (url === '/api/session') {
      return (routes.session ?? noAccountResponse)();
    }
    if (url === '/api/account' && routes.account) {
      return routes.account();
    }

    return Promise.reject(new Error(`Ruta no simulada: ${url}`));
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function stubFetch(health: () => Promise<Response>) {
  return stubServer({ health });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('muestra «Conectando…» y luego «Conectado con el servidor»', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    stubFetch(() => pending);

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(texts.checking);

    resolveFetch(jsonResponse({ status: 'ok' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
  });

  it('avisa y ofrece «Reintentar» cuando la red falla', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.getByRole('button', { name: texts.retry })).toBeVisible();
    expect(screen.queryByText(texts.connected)).not.toBeInTheDocument();
  });

  it('avisa cuando el servidor responde 503', async () => {
    stubFetch(() => Promise.resolve(jsonResponse({ error: { code: 'database_unavailable' } }, 503)));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.getByRole('button', { name: texts.retry })).toBeVisible();
  });

  it('avisa cuando el servidor responde 200 con un estado distinto de «ok»', async () => {
    stubFetch(() => Promise.resolve(jsonResponse({ status: 'degraded' })));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.getByRole('button', { name: texts.retry })).toBeVisible();
    expect(screen.queryByText(texts.connected)).not.toBeInTheDocument();
  });

  it('avisa cuando el servidor responde 200 con un cuerpo que no es JSON', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response('<html>ok</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.getByRole('button', { name: texts.retry })).toBeVisible();
    expect(screen.queryByText(texts.connected)).not.toBeInTheDocument();
  });

  it('devuelve el foco a «Reintentar» cuando el reintento vuelve a fallar', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const user = userEvent.setup();

    render(<App />);

    const retryButton = await screen.findByRole('button', { name: texts.retry });
    await user.tab();
    expect(retryButton).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: texts.retry })).toHaveFocus();
    });
  });

  it('mantiene un único estado vivo montado y vacío mientras se muestra el aviso', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('mueve el foco al mismo estado vivo cuando el reintento tiene éxito', async () => {
    const fetchMock = stubFetch(() => Promise.resolve(jsonResponse({ status: 'ok' })));
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    const status = await screen.findByRole('status');
    expect(status.textContent).toBe('');

    await user.click(await screen.findByRole('button', { name: texts.retry }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveAttribute('tabindex', '-1');
    expect(status).toHaveFocus();
  });

  it('marca el estado vacío mientras no hay conexión y lo saca de esa clase al conectar', async () => {
    const fetchMock = stubFetch(() => Promise.resolve(jsonResponse({ status: 'ok' })));
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    const status = await screen.findByRole('status');
    expect(status.textContent).toBe('');
    expect(status).toHaveClass('status-empty');

    await user.click(await screen.findByRole('button', { name: texts.retry }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
    expect(screen.getByRole('status')).not.toHaveClass('status-empty');
  });

  it('enfoca el estado mientras dice «Conectando…» y sigue ahí al conectar', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = stubFetch(() => pending);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: texts.retry }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(texts.checking);
    expect(status).toHaveFocus();

    resolveFetch(jsonResponse({ status: 'ok' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
    expect(status).toHaveFocus();
  });

  it('enfoca el estado durante «Conectando…» y vuelve a «Reintentar» si falla', async () => {
    let rejectFetch: (error: Error) => void = () => undefined;
    const pending = new Promise<Response>((_resolve, reject) => {
      rejectFetch = reject;
    });
    const fetchMock = stubFetch(() => pending);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: texts.retry }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(texts.checking);
    expect(status).toHaveFocus();

    rejectFetch(new TypeError('Failed to fetch'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: texts.retry })).toHaveFocus();
    });
  });

  it('«Reintentar» vuelve a consultar y muestra «Conectado con el servidor» sin aviso', async () => {
    const fetchMock = stubFetch(() => Promise.resolve(jsonResponse({ status: 'ok' })));
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: texts.retry }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: texts.retry })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      '/api/health',
      '/api/health',
      '/api/session',
    ]);
  });
});

describe('App con la cuenta y la sesión', () => {
  it('sin cuenta muestra el formulario «Crear la cuenta» bajo la línea de estado', async () => {
    stubServer();

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: texts.createAccountHeading }),
    ).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    expect(screen.getByRole('button', { name: texts.createAccountButton })).toBeVisible();
    expect(screen.queryByText(texts.accountExists)).not.toBeInTheDocument();
  });

  it('con cuenta y sin sesión muestra «La cuenta ya está creada.» sin formulario', async () => {
    stubServer({
      session: () =>
        Promise.resolve(jsonResponse({ accountExists: true, username: null })),
    });

    render(<App />);

    expect(await screen.findByText(texts.accountExists)).toBeVisible();
    expect(screen.queryByRole('button', { name: texts.createAccountButton })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
  });

  it('con sesión muestra «Sesión iniciada como <usuario>» sin enfocarlo en la carga', async () => {
    stubServer({
      session: () =>
        Promise.resolve(jsonResponse({ accountExists: true, username: 'ana' })),
    });

    render(<App />);

    const result = await screen.findByText('Sesión iniciada como ana');
    expect(result).toBeVisible();
    expect(result).toHaveClass('screen-text');
    expect(result).toHaveAttribute('tabindex', '-1');
    expect(result).not.toHaveFocus();
    expect(screen.queryByRole('button', { name: texts.createAccountButton })).not.toBeInTheDocument();
  });

  it('muestra el aviso y «Reintentar» cuando la sesión falla, y el reintento repite las dos llamadas', async () => {
    const fetchMock = stubServer({ session: () => Promise.resolve(jsonResponse({}, 503)) });
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
    expect(screen.queryByRole('heading', { name: texts.createAccountHeading })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: texts.retry }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
        '/api/health',
        '/api/session',
        '/api/health',
        '/api/session',
      ]);
    });
  });

  it('muestra el aviso cuando la sesión responde con otra forma', async () => {
    stubServer({ session: () => Promise.resolve(jsonResponse({ status: 'ok' })) });

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(texts.disconnected);
  });

  it('tras crear la cuenta muestra la sesión y mueve el foco al resultado', async () => {
    stubServer({
      account: () => Promise.resolve(jsonResponse({ username: 'ana' }, 201)),
    });
    const user = userEvent.setup();

    render(<App />);

    await user.type(await screen.findByLabelText(texts.usernameLabel), 'Ana');
    await user.type(screen.getByLabelText(texts.passwordLabel), 'una frase larga y secreta');
    await user.type(screen.getByLabelText(texts.repeatPasswordLabel), 'una frase larga y secreta');
    await user.click(screen.getByRole('button', { name: texts.createAccountButton }));

    const result = await screen.findByText('Sesión iniciada como ana');
    expect(result).toHaveFocus();
    expect(screen.queryByRole('button', { name: texts.createAccountButton })).not.toBeInTheDocument();
  });

  it('si la cuenta ya existía al enviar muestra «La cuenta ya está creada.» y lo enfoca', async () => {
    stubServer({
      account: () =>
        Promise.resolve(jsonResponse({ error: { code: 'account_exists', message: 'm' } }, 409)),
    });
    const user = userEvent.setup();

    render(<App />);

    await user.type(await screen.findByLabelText(texts.usernameLabel), 'Ana');
    await user.type(screen.getByLabelText(texts.passwordLabel), 'una frase larga y secreta');
    await user.type(screen.getByLabelText(texts.repeatPasswordLabel), 'una frase larga y secreta');
    await user.click(screen.getByRole('button', { name: texts.createAccountButton }));

    const result = await screen.findByText(texts.accountExists);
    expect(result).toHaveFocus();
    expect(screen.queryByRole('button', { name: texts.createAccountButton })).not.toBeInTheDocument();
  });
});
