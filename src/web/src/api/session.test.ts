import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession } from './session';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSession', () => {
  it('devuelve la cuenta y el usuario cuando hay sesión', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ accountExists: true, username: 'ana' })),
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(await getSession()).toEqual({ kind: 'ok', accountExists: true, username: 'ana' });
    expect(fetchMock).toHaveBeenCalledWith('/api/session', { credentials: 'same-origin' });
  });

  it('devuelve el usuario nulo cuando no hay sesión', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(jsonResponse({ accountExists: false, username: null })),
    );

    expect(await getSession()).toEqual({ kind: 'ok', accountExists: false, username: null });
  });

  it('da error con un 503', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(jsonResponse({ error: { code: 'database_unavailable' } }, 503)),
    );

    expect(await getSession()).toEqual({ kind: 'error' });
  });

  it('da error cuando la red cae', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    expect(await getSession()).toEqual({ kind: 'error' });
  });

  it('da error con un 200 de otra forma', async () => {
    for (const body of [
      { status: 'ok' },
      { accountExists: 'si', username: null },
      { accountExists: true, username: 5 },
      { accountExists: true },
      null,
      [],
    ]) {
      vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(body)));

      expect(await getSession(), JSON.stringify(body)).toEqual({ kind: 'error' });
    }
  });

  it('da error con un 200 que no es JSON', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html></html>', { status: 200 })));

    expect(await getSession()).toEqual({ kind: 'error' });
  });
});
