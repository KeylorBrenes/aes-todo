type HealthBody = {
  status?: unknown;
};

function isHealthy(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as HealthBody).status === 'ok';
}

/**
 * Consulta el estado del servidor. Solo es `true` cuando responde con 2xx y
 * `{"status":"ok"}`; un error de red, una respuesta no exitosa o un cuerpo
 * inesperado cuentan como `false`.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');

    if (!response.ok) {
      return false;
    }

    return isHealthy(await response.json());
  } catch {
    return false;
  }
}
