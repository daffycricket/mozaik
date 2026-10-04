import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

type RunResult = { ok: boolean; output: string };

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tsconfigBase = join(repoRoot, 'packages/config/tsconfig.base.json');
const sharedBiomeConfig = join(repoRoot, 'packages/config/biome.base.json');
const tscBin = join(repoRoot, 'node_modules', '.bin', 'tsc');
const biomeBin = join(repoRoot, 'node_modules', '.bin', 'biome');

function run(command: string, args: string[], cwd: string): RunResult {
  try {
    const output = execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, output };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` };
  }
}

function writeFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
}

describe('[T-001-AC3] strict TypeScript configuration', () => {
  let projectDir = '';

  beforeAll(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'mozaik-ts-'));
    writeFile(
      join(projectDir, 'tsconfig.json'),
      `${JSON.stringify(
        { extends: relative(projectDir, tsconfigBase), include: ['*.ts'] },
        null,
        2,
      )}\n`,
    );
  });

  afterAll(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  test('[T-001-AC3] accepts valid TypeScript', () => {
    writeFile(join(projectDir, 'case.ts'), 'export const value: number = 1;\n');
    const result = run(tscBin, ['--noEmit', '-p', join(projectDir, 'tsconfig.json')], projectDir);
    expect(result.ok, result.output).toBe(true);
  });

  test('[T-001-AC3] rejects a deliberate type error', () => {
    writeFile(join(projectDir, 'case.ts'), 'export const value: string = undefined;\n');
    const result = run(tscBin, ['--noEmit', '-p', join(projectDir, 'tsconfig.json')], projectDir);
    expect(result.ok).toBe(false);
  });
});

describe('[T-001-AC6] Biome lint configuration', () => {
  let projectDir = '';

  beforeAll(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'mozaik-biome-'));
    writeFile(
      join(projectDir, 'biome.json'),
      `${JSON.stringify(
        {
          extends: [relative(projectDir, sharedBiomeConfig)],
          vcs: { enabled: false },
          formatter: { enabled: false },
          assist: { enabled: false },
        },
        null,
        2,
      )}\n`,
    );
  });

  afterAll(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const rejected: Array<{ rule: string; source: string }> = [
    { rule: 'explicit any', source: 'export const value: any = 1;\n' },
    {
      rule: 'non-null assertion',
      source: 'export function f(value?: string) { return value!; }\n',
    },
    { rule: 'unused variable', source: 'const unused = 1;\n' },
    { rule: 'console.log', source: 'console.log("debug");\n' },
  ];

  test.each(rejected)('[T-001-AC6] rejects $rule', ({ source }) => {
    writeFile(join(projectDir, 'case.ts'), source);
    const result = run(biomeBin, ['check', '.'], projectDir);
    expect(result.ok).toBe(false);
  });

  test('[T-001-AC6] accepts a clean file', () => {
    writeFile(join(projectDir, 'case.ts'), 'export const value: number = 1;\n');
    const result = run(biomeBin, ['check', '.'], projectDir);
    expect(result.ok, result.output).toBe(true);
  });

  test('[T-001-AC6] restricts imports and globals per package', () => {
    const config = JSON.parse(readFileSync(join(repoRoot, 'biome.json'), 'utf8')) as {
      overrides?: Array<{ includes?: string[] }>;
    };
    const includes = (config.overrides ?? []).flatMap((override) => override.includes ?? []);
    expect(includes).toContain('packages/model/**');
    expect(includes).toContain('apps/web/**');
    expect(includes).toContain('apps/server/**');
  });
});
