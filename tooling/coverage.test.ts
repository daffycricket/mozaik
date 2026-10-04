import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import coverageConfig from '../vitest.cov.config';

type CoverageConfig = {
  test?: { coverage?: { provider?: string; thresholds?: { lines?: number; branches?: number } } };
};

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const vitestBin = join(repoRoot, 'node_modules/.bin/vitest');
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function runCoverage(cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(vitestBin, ['run', '--coverage'], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { ok: true, output };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` };
  }
}

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mozaik-cov-'));
  tempDirs.push(dir);
  symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'), 'dir');
  writeFileSync(
    join(dir, 'vitest.config.ts'),
    [
      "import { defineConfig } from 'vitest/config';",
      'export default defineConfig({',
      '  test: {',
      "    include: ['src.test.ts'],",
      "    coverage: { provider: 'v8', include: ['src.ts'], reporter: ['text'], thresholds: { lines: 100, branches: 100 } },",
      '  },',
      '});',
      '',
    ].join('\n'),
    'utf8',
  );
  return dir;
}

describe('[T-002-AC3] coverage threshold', () => {
  test('[T-002-AC3] configures a blocking 80% lines and branches threshold', () => {
    const coverage = (coverageConfig as unknown as CoverageConfig).test?.coverage;
    expect(coverage?.provider).toBe('v8');
    expect(coverage?.thresholds?.lines).toBe(80);
    expect(coverage?.thresholds?.branches).toBe(80);
  });

  test('[T-002-AC3] fails when the coverage is below the threshold', () => {
    const dir = makeProject();
    writeFileSync(join(dir, 'src.ts'), 'export function uncovered(): number { return 1; }\n');
    writeFileSync(
      join(dir, 'src.test.ts'),
      "import { expect, test } from 'vitest';\ntest('passes', () => {\n  expect(1).toBe(1);\n});\n",
    );
    const result = runCoverage(dir);
    expect(result.ok, result.output).toBe(false);
  });

  test('[T-002-AC3] passes when the coverage reaches the threshold', () => {
    const dir = makeProject();
    writeFileSync(join(dir, 'src.ts'), 'export function covered(): number { return 1; }\n');
    writeFileSync(
      join(dir, 'src.test.ts'),
      "import { expect, test } from 'vitest';\nimport { covered } from './src';\ntest('passes', () => {\n  expect(covered()).toBe(1);\n});\n",
    );
    const result = runCoverage(dir);
    expect(result.ok, result.output).toBe(true);
  });
});
