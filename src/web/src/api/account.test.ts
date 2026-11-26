import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAccount } from './account';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubResponse(response: Response) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAccount', () => {
  it('envía el usuario y la contraseña tal cual, como JSON y con las cookies del mismo origen', async () => {
    const fetchMock = stubResponse(jsonResponse({ username: 'ana' }, 201));

    await createAccount('Ana', 'una frase larga y secreta');

    expect(fetchMock).toHaveBeenCalledWith('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: 'Ana', password: 'una frase larga y secreta' }),
    });
  });

  it('un 201 con el usuario es «created»', async () => {
    stubResponse(jsonResponse({ username: 'ana' }, 201));

    expect(await createAccount('Ana', 'x')).toEqual({ kind: 'created', username: 'ana' });
  });

  it('un 201 con otro cuerpo es «failed»', async () => {
    for (const body of [{ user: 'ana' }, { username: 3 }, null]) {
      stubResponse(jsonResponse(body, 201));

      expect(await createAccount('ana', 'x'), JSON.stringify(body)).toEqual({ kind: 'failed' });
    }
  });

  it('un 400 «validation_failed» con campos es «invalid»', async () => {
    stubResponse(
      jsonResponse(
        { error: { code: 'validation_failed', message: 'm', fields: { username: 'invalid' } } },
        400,
      ),
    );

    expect(await createAccount('a', 'x')).toEqual({
      kind: 'invalid',
      fields: { username: 'invalid' },
    });
  });

  it('un 400 con otro código o sin campos es «failed»', async () => {
    for (const body of [
      { error: { code: 'invalid_body', message: 'm' } },
      { error: { code: 'validation_failed', message: 'm' } },
      { error: { code: 'validation_failed', fields: 'username' } },
      {},
    ]) {
      stubResponse(jsonResponse(body, 400));

      expect(await createAccount('a', 'x'), JSON.stringify(body)).toEqual({ kind: 'failed' });
    }
  });

  it('un 409 es «exists»', async () => {
    stubResponse(jsonResponse({ error: { code: 'account_exists', message: 'm' } }, 409));

    expect(await createAccount('ana', 'x')).toEqual({ kind: 'exists' });
  });

  it('un 500 y un 503 son «failed»', async () => {
    for (const status of [500, 503]) {
      stubResponse(jsonResponse({ error: { code: 'internal', message: 'm' } }, status));

      expect(await createAccount('ana', 'x'), String(status)).toEqual({ kind: 'failed' });
    }
  });

  it('una red caída es «failed»', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    expect(await createAccount('ana', 'x')).toEqual({ kind: 'failed' });
  });

  it('un cuerpo que no es JSON es «failed»', async () => {
    for (const status of [201, 400]) {
      stubResponse(new Response('<html></html>', { status }));

      expect(await createAccount('ana', 'x'), String(status)).toEqual({ kind: 'failed' });
    }
  });
});
