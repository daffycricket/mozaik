import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { type DockerRunner, type DockerTestContext, runDockerScenario } from './docker';
import { readDockerStatus } from './report';
import { buildVerifyPlan } from './verify';

const CONTEXT: DockerTestContext = {
  project: 'mozaik-test-42',
  port: 8080,
  baseUrl: 'http://127.0.0.1:8080',
};

function runnerWith(overrides: Partial<DockerRunner>): {
  runner: DockerRunner;
  downCalls: Array<{ project: string; removeVolumes: boolean }>;
} {
  const downCalls: Array<{ project: string; removeVolumes: boolean }> = [];
  const runner: DockerRunner = {
    available: () => true,
    up: () => undefined,
    waitForHealth: async () => undefined,
    runTests: () => 0,
    down: (project, removeVolumes) => {
      downCalls.push({ project, removeVolumes });
    },
    ...overrides,
  };
  return { runner, downCalls };
}

describe('[T-005-AC5] docker scenario', () => {
  test('[T-005-AC5] tears the project and its volume down even when the tests fail', async () => {
    const { runner, downCalls } = runnerWith({ runTests: () => 1 });
    const result = await runDockerScenario(runner, CONTEXT);
    expect(result).toEqual({ exitCode: 1, ran: true });
    expect(downCalls).toEqual([{ project: 'mozaik-test-42', removeVolumes: true }]);
  });

  test('[T-005-AC5] tears the project down when bringing the stack up fails', async () => {
    const { runner, downCalls } = runnerWith({
      up: () => {
        throw new Error('build failed');
      },
    });
    await expect(runDockerScenario(runner, CONTEXT)).rejects.toThrow('build failed');
    expect(downCalls).toEqual([{ project: 'mozaik-test-42', removeVolumes: true }]);
  });

  test('[T-005-AC5] warns and touches nothing when Docker is unavailable', async () => {
    const { runner, downCalls } = runnerWith({ available: () => false });
    const result = await runDockerScenario(runner, CONTEXT);
    expect(result).toEqual({ exitCode: 0, ran: false });
    expect(downCalls).toHaveLength(0);
  });
});

describe('[T-005-AC6] verify and report Docker awareness', () => {
  test('[T-005-AC6] appends test:docker to the plan only when Docker is available', () => {
    expect(buildVerifyPlan(false).map((step) => step.name)).toEqual([
      'lint',
      'typecheck',
      'test:cov',
      'test:e2e',
      'ac:check',
    ]);
    expect(buildVerifyPlan(true).map((step) => step.name)).toEqual([
      'lint',
      'typecheck',
      'test:cov',
      'test:e2e',
      'ac:check',
      'test:docker',
    ]);
  });

  test('[T-005-AC6] reports the image as verified only when the marker exists', () => {
    const repo = mkdtempSync(join(tmpdir(), 'mozaik-docker-'));
    expect(readDockerStatus(repo)).toBe('non vérifié');
    mkdirSync(join(repo, 'test-results'), { recursive: true });
    writeFileSync(join(repo, 'test-results/docker-verified.json'), '{}', 'utf8');
    expect(readDockerStatus(repo)).toBe('vérifié');
    rmSync(repo, { recursive: true, force: true });
  });
});

describe('[T-005-AC7] README Docker launch', () => {
  test('[T-005-AC7] documents the delivered Docker launch', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('docker compose up --build');
    expect(readme).toContain('http://localhost:8080');
    expect(readme).toContain('board-data');
    expect(readme).toContain('docker compose down -v');
  });
});
