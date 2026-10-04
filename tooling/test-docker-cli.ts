import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDockerRunner, type DockerTestContext, runDockerScenario } from './docker';
import { findFreePort } from './ports';

const port = await findFreePort();
const context: DockerTestContext = {
  project: `mozaik-test-${process.pid}`,
  port,
  baseUrl: `http://127.0.0.1:${port}`,
};

const runner = createDockerRunner();
const result = await runDockerScenario(runner, context);

if (result.ran && result.exitCode === 0) {
  const marker = join('test-results', 'docker-verified.json');
  mkdirSync('test-results', { recursive: true });
  writeFileSync(marker, `${JSON.stringify({ verifiedAt: new Date().toISOString() })}\n`, 'utf8');
}

process.exit(result.exitCode);
