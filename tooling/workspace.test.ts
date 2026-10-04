import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

type RootManifest = {
  packageManager?: string;
  engines?: { node?: string };
};

type WorkspaceManifest = {
  name?: string;
};

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8')) as T;
}

describe('[T-001-AC1] workspace bootstrap', () => {
  test('[T-001-AC1] pins the package manager and the Node engine', () => {
    const manifest = readJson<RootManifest>('package.json');
    expect(manifest.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
    expect(manifest.engines?.node).toBe('>=24');
  });

  test('[T-001-AC1] declares the workspace globs for apps and packages', () => {
    const workspace = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8');
    expect(workspace).toContain('apps/*');
    expect(workspace).toContain('packages/*');
  });

  test('[T-001-AC1] exposes the web, server and model workspaces', () => {
    for (const workspacePath of ['apps/web', 'apps/server', 'packages/model']) {
      const manifest = readJson<WorkspaceManifest>(`${workspacePath}/package.json`);
      expect(manifest.name).toMatch(/^@mozaik\//);
    }
  });
});
