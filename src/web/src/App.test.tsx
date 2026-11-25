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

function stubFetch(implementation: () => Promise<Response>) {
  const mock = vi.fn(implementation);
  vi.stubGlobal('fetch', mock);
  return mock;
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

  it('no deja el foco en el documento cuando el reintento tiene éxito', async () => {
    const fetchMock = stubFetch(() => Promise.resolve(jsonResponse({ status: 'ok' })));
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();

    render(<App />);

    const retryButton = await screen.findByRole('button', { name: texts.retry });
    await user.tab();
    expect(retryButton).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(texts.connected);
    });
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole('main')).toContainElement(
      document.activeElement as HTMLElement | null,
    );
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
