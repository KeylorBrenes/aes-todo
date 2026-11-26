export type SessionResult =
  | { kind: 'ok'; accountExists: boolean; username: string | null }
  | { kind: 'error' };

type SessionBody = { accountExists: boolean; username: string | null };

function isSessionBody(body: unknown): body is SessionBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accountExists, username } = body as Record<string, unknown>;

  return typeof accountExists === 'boolean' && (username === null || typeof username === 'string');
}

/**
 * Consulta si la cuenta existe y quién tiene sesión en este navegador. Un error de red,
 * una respuesta no exitosa o un cuerpo con otra forma dan `{ kind: 'error' }`.
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin' });

    if (!response.ok) {
      return { kind: 'error' };
    }

    const body: unknown = await response.json();

    if (!isSessionBody(body)) {
      return { kind: 'error' };
    }

    return { kind: 'ok', accountExists: body.accountExists, username: body.username };
  } catch {
    return { kind: 'error' };
  }
}
