import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { findColorLiterals, runColorCheck } from './check-colors';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function setup(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'mozaik-colors-'));
  tempDirs.push(dir);
  for (const [relative, content] of Object.entries(files)) {
    const path = join(dir, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
  }
  return dir;
}

describe('[T-006-AC7] hardcoded color check', () => {
  test('[T-006-AC7] flags hex values, color functions and arbitrary Tailwind colors', () => {
    const source = [
      "const a = '#fff';",
      "const b = 'rgb(1, 2, 3)';",
      "const c = 'oklch(0.5 0 0)';",
      "const d = 'bg-[#fff]';",
    ].join('\n');
    const found = findColorLiterals(source).map((entry) => entry.match);
    expect(found).toContain('#fff');
    expect(found).toContain('rgb(');
    expect(found).toContain('oklch(');
    expect(found).toContain('[#');
  });

  test('[T-006-AC7] accepts theme classes and theme-based color mixes', () => {
    const source = [
      "const a = 'bg-primary text-muted-foreground border-border';",
      "const b = 'bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]';",
      "const c = 'text-[0.8rem]';",
    ].join('\n');
    expect(findColorLiterals(source)).toEqual([]);
  });

  test('[T-006-AC7] scans apps/web/src but exempts the theme, tokens and tests', () => {
    const dir = setup({
      'apps/web/src/app/board.tsx': "export const color = '#fff';\n",
      'apps/web/src/index.css': ':root { --canvas-bg: #FAFAFA; }\n',
      'apps/web/src/lib/theme-tokens.ts': "export const token = 'oklch(0.5 0 0)';\n",
      'apps/web/src/lib/theme-tokens.test.ts': "const expected = '#FAFAFA';\n",
    });
    const violations = runColorCheck(dir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.file).toBe('apps/web/src/app/board.tsx');
  });

  test('[T-006-AC7] reports no hardcoded color in the real application', () => {
    expect(runColorCheck(repoRoot)).toEqual([]);
  });
});
