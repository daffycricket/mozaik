import { execFileSync } from 'node:child_process';

const COMPOSE_FILE = 'docker-compose.yml';

function project(): string {
  const value = process.env.MOZAIK_DOCKER_PROJECT;
  if (value === undefined) {
    throw new Error('MOZAIK_DOCKER_PROJECT is not set');
  }
  return value;
}

/**
 * Runs a `docker compose` command against the dedicated test project.
 */
export function compose(...args: string[]): string {
  return execFileSync('docker', ['compose', '-f', COMPOSE_FILE, '-p', project(), ...args], {
    encoding: 'utf8',
  });
}

/**
 * Waits until the packaged application answers its healthcheck.
 */
export async function waitForHealth(baseUrl: string): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // The container is not ready yet.
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`Docker stack at ${baseUrl} did not become healthy`);
}
