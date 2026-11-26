export type FieldErrors = { username?: string; password?: string };

export type CreateAccountResult =
  | { kind: 'created'; username: string }
  | { kind: 'exists' }
  | { kind: 'invalid'; fields: FieldErrors }
  | { kind: 'failed' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCreated(body: unknown): CreateAccountResult {
  if (isRecord(body) && typeof body.username === 'string') {
    return { kind: 'created', username: body.username };
  }

  return { kind: 'failed' };
}

function readInvalid(body: unknown): CreateAccountResult {
  const error = isRecord(body) ? body.error : undefined;

  if (isRecord(error) && error.code === 'validation_failed' && isRecord(error.fields)) {
    return { kind: 'invalid', fields: error.fields as FieldErrors };
  }

  return { kind: 'failed' };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Crea la única cuenta. 201 con el usuario → `created`; 409 → `exists`; 400
 * `validation_failed` con `fields` → `invalid`; cualquier otra cosa (otro estado, red caída,
 * cuerpo inesperado o que no es JSON) → `failed`.
 */
export async function createAccount(
  username: string,
  password: string,
): Promise<CreateAccountResult> {
  try {
    const response = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 409) {
      return { kind: 'exists' };
    }

    if (response.status === 201) {
      return readCreated(await readJson(response));
    }

    if (response.status === 400) {
      return readInvalid(await readJson(response));
    }

    return { kind: 'failed' };
  } catch {
    return { kind: 'failed' };
  }
}
