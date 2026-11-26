import { test as base, expect } from '@playwright/test';
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export { expect };

// Debe coincidir con `BASE_URL` de playwright.config.ts y con el contrato de EN-001.
export const BASE_URL = 'http://127.0.0.1:5080';
const HOST = '127.0.0.1';
const PORT = 5080;
const STARTUP_TIMEOUT_MS = 200_000;

// Raíz del repositorio: tests/acceptance/fixtures → ../../..
const repoRoot = resolve(__dirname, '..', '..', '..');

export type AppHandle = {
  /** Archivo SQLite que el servidor debe crear al arrancar (no existía antes). */
  dbPath: string;
  /** Carpeta de la web compilada que entrega el servidor. */
  webDist: string;
};

type Server = {
  child: ChildProcess;
  tempDir: string;
};

function tail(text: string, lines = 40): string {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(-lines)
    .join('\n');
}

// La web se compila una sola vez por worker: cada prueba arranca su propio servidor,
// pero no tiene sentido recompilar la web en cada una.
let webBuilt = false;
function buildWebOnce(): void {
  if (webBuilt) return;
  webBuilt = true;
  // El contrato solo compila la web si existe: TASK-001 aún no tiene web.
  if (!existsSync(join(repoRoot, 'src', 'web', 'package.json'))) return;
  execSync('npm --prefix src/web run build', { cwd: repoRoot, stdio: 'inherit', shell: true });
}

function startServer(dbPath: string, webDist: string): ChildProcess {
  const cargo = process.env.CARGO ?? 'cargo';
  return spawn(cargo, ['run', '--locked', '--manifest-path', join('src', 'server', 'Cargo.toml')], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: `sqlite:${dbPath}`,
      APP_ADDR: `${HOST}:${PORT}`,
      WEB_DIST: webDist,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    // Grupo de procesos propio para poder terminarlo entero (cargo y su servidor hijo).
    detached: process.platform !== 'win32',
  });
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function stopServer(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32' && child.pid) {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      /* el proceso ya no existe */
    }
  } else if (child.pid) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
  // Espera a que libere el puerto antes de que la siguiente prueba arranque otro.
  await waitForExit(child, 10_000);
}

/** El puerto debe estar libre antes de arrancar el servidor de la prueba. */
async function waitForPortFree(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const busy = await new Promise<boolean>((resolve) => {
      const socket = createConnection({ host: HOST, port: PORT });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
      socket.setTimeout(1_000, () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (!busy) return;
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`El puerto ${PORT} sigue ocupado: la prueba anterior no terminó su servidor.`);
}

async function waitForHealth(
  child: ChildProcess,
  getLogs: () => string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let startupError: string | null = null;
  let lastError = 'sin respuesta';

  child.once('exit', (code, signal) => {
    startupError = `el servidor terminó (código ${code}, señal ${signal})`;
  });
  child.once('error', (error) => {
    startupError = `no se pudo ejecutar «${process.env.CARGO ?? 'cargo'}»: ${error.message}`;
  });

  while (Date.now() < deadline) {
    if (startupError) {
      throw new Error(`${startupError}\n--- salida del servidor ---\n${tail(getLogs())}`);
    }
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(3_000),
      });
      if (response.ok) return;
      lastError = `GET /api/health → HTTP ${response.status}`;
    } catch (error) {
      lastError = `GET /api/health → ${(error as Error).message}`;
    }
    await new Promise((done) => setTimeout(done, 500));
  }

  throw new Error(
    `El servidor no respondió en ${Math.round(timeoutMs / 1000)} s (${lastError}).\n` +
      `--- salida del servidor ---\n${tail(getLogs())}`,
  );
}

/**
 * Arranca la app como un solo servidor, tal como la usa el dueño:
 * `cargo run --locked` con una base de datos **que no existe** en una carpeta temporal.
 * El fixture tiene alcance de prueba: cada prueba parte de una base vacía (sin cuenta),
 * que es lo que exigen las pruebas de US-001. Si el servidor no arranca (código aún sin
 * implementar), la prueba falla con esa causa.
 */
export const test = base.extend<{ app: AppHandle }>({
  app: [
    async ({}, use) => {
      buildWebOnce();
      await waitForPortFree(30_000);

      const tempDir = mkdtempSync(join(tmpdir(), 'aes-todo-'));
      const dbPath = join(tempDir, 'aes-todo.db');
      if (existsSync(dbPath)) throw new Error(`La base de datos de prueba ya existía: ${dbPath}`);
      const webDist = join(repoRoot, 'src', 'web', 'dist');

      const logs: string[] = [];
      const getLogs = () => logs.join('');
      const child = startServer(dbPath, webDist);
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk: string) => logs.push(chunk));
      child.stderr?.on('data', (chunk: string) => logs.push(chunk));

      const server: Server = { child, tempDir };
      try {
        await waitForHealth(child, getLogs, STARTUP_TIMEOUT_MS);
        await use({ dbPath, webDist });
      } finally {
        await stopServer(server.child);
        try {
          rmSync(server.tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        } catch {
          /* Windows puede retener el archivo un instante; la carpeta es temporal */
        }
      }
    },
    { auto: true },
  ],
});
