import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { runAcCheck } from './ac-check';
import { collectCriteria, extractCriterionIds } from './acceptance';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function setup(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'mozaik-ac-'));
  tempDirs.push(dir);
  for (const [relative, content] of Object.entries(files)) {
    const path = join(dir, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
  }
  return dir;
}

describe('[T-002-AC4] acceptance criteria check', () => {
  test('[T-002-AC4] ignores criteria covered by a test', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.total).toBe(1);
    expect(result.covered).toBe(1);
    expect(result.uncovered).toEqual([]);
  });

  test('[T-002-AC4] reports every uncovered feature criterion as blocking', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\nF99-S2-AC1\nF99-S3-AC1\n',
      'e2e/covered.spec.ts': "test('[F99-S2-AC1] works', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.uncovered.map((criterion) => criterion.id).sort()).toEqual([
      'F99-S1-AC1',
      'F99-S3-AC1',
    ]);
  });

  test('[T-002-AC4] checks the technical requirements and the bug criteria', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'docs/exigences-techniques.md': '- **T-999-AC1** : rule\n- **B-999-AC1** : regression\n',
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
      'tooling/covered.test.ts': "test('[B-999-AC1] stays fixed', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.total).toBe(3);
    expect(result.uncovered.map((criterion) => criterion.id)).toEqual(['T-999-AC1']);
  });

  test('[T-002-AC4] does not read the former backlog', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'docs/backlog.md': '- **T-998-AC1** : former ticket\n',
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
    });
    expect(runAcCheck(repo).total).toBe(1);
  });
});

describe('[T-006-AC5] UI rule coverage check', () => {
  test('[T-006-AC5] collects the UI rules of the design screens and maps them to their story', () => {
    const uiRules = collectCriteria(repoRoot).filter((criterion) => criterion.source === 'ui');
    expect(uiRules.length).toBeGreaterThan(0);
    for (const rule of uiRules) {
      expect(rule.id).toMatch(/^UI-[A-Z]+-\d+$/);
      expect(rule.ticketId).toMatch(/^F\d{2}-S\d+$/);
    }
    expect(uiRules.some((rule) => rule.id === 'UI-MENU-1' && rule.ticketId === 'F01-S2')).toBe(
      true,
    );
  });

  test('[T-006-AC5] treats an uncovered UI rule as blocking like any other criterion', () => {
    const repo = setup({
      'docs/design/ecrans.md': [
        '| ID | Règle | Story |',
        '|---|---|---|',
        '| UI-TEST-1 | rule | F99-S1 |',
        '',
      ].join('\n'),
    });
    const result = runAcCheck(repo);
    expect(result.uncovered.map((criterion) => criterion.id)).toEqual(['UI-TEST-1']);
  });
});

describe('[T-002-AC5] criterion identifiers of a plan', () => {
  test('[T-002-AC5] lists the criteria mentioned in a text once, in order', () => {
    const text = 'F08-S1-AC6 then UI-DEL-1, T-002-AC5, B-003-AC1 and F08-S1-AC6 again; MZK-42-AC1';
    expect(extractCriterionIds(text)).toEqual(['F08-S1-AC6', 'UI-DEL-1', 'T-002-AC5', 'B-003-AC1']);
  });
});
