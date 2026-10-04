import { execFileSync, spawnSync } from 'node:child_process';

export const COMPOSE_FILE = 'docker-compose.yml';

export type DockerTestContext = {
  project: string;
  port: number;
  baseUrl: string;
};

export type DockerRunner = {
  available: () => boolean;
  up: (context: DockerTestContext) => void | Promise<void>;
  waitForHealth: (baseUrl: string) => Promise<void>;
  runTests: (context: DockerTestContext) => number | Promise<number>;
  down: (project: string, removeVolumes: boolean) => void | Promise<void>;
};

export type DockerScenarioResult = {
  exitCode: number;
  ran: boolean;
};

/**
 * Brings the packaged stack up, waits for its healthcheck, runs the dedicated
 * Playwright suite and always tears the project and its volume down. Without
 * Docker it warns and succeeds (AGENTS.md §8, `process/testing.md`).
 */
export async function runDockerScenario(
  runner: DockerRunner,
  context: DockerTestContext,
): Promise<DockerScenarioResult> {
  if (!runner.available()) {
    process.stderr.write('test:docker: Docker is not available, skipping the image check\n');
    return { exitCode: 0, ran: false };
  }
  try {
    await runner.up(context);
    await runner.waitForHealth(context.baseUrl);
    const exitCode = await runner.runTests(context);
    return { exitCode, ran: true };
  } finally {
    await runner.down(context.project, true);
  }
}

/**
 * Runner backed by the real `docker` CLI and `pnpm exec playwright`.
 */
export function createDockerRunner(): DockerRunner {
  return {
    available: () => {
      try {
        execFileSync('docker', ['info'], { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    },
    up: (context) => {
      execFileSync(
        'docker',
        ['compose', '-f', COMPOSE_FILE, '-p', context.project, 'up', '--build', '-d'],
        { stdio: 'inherit', env: { ...process.env, MOZAIK_PORT: String(context.port) } },
      );
    },
    waitForHealth: async (baseUrl) => {
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
    },
    runTests: (context) => {
      const result = spawnSync(
        'pnpm',
        ['exec', 'playwright', 'test', '--config', 'e2e-docker/playwright.config.ts'],
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            MOZAIK_DOCKER_BASE_URL: context.baseUrl,
            MOZAIK_DOCKER_PROJECT: context.project,
            MOZAIK_DOCKER_PORT: String(context.port),
          },
        },
      );
      return result.status ?? 1;
    },
    down: (project) => {
      execFileSync('docker', ['compose', '-f', COMPOSE_FILE, '-p', project, 'down', '-v'], {
        stdio: 'inherit',
      });
    },
  };
}
