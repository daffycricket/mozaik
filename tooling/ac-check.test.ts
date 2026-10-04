import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { runAcCheck } from './ac-check';
import { collectCriteria } from './acceptance';

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

function backlogTable(statuses: Record<string, string>): string {
  const rows = Object.entries(statuses).map(
    ([id, status], index) => `| ${index + 1} | ${id} | Ticket | story |  | ${status} |  |`,
  );
  return [
    '| # | ID | Titre | Type | Dépend de | Statut | Notes |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

describe('[T-002-AC4] acceptance criteria check', () => {
  test('[T-002-AC4] ignores criteria covered by a test', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'docs/backlog.md': backlogTable({ 'F99-S1': 'done' }),
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.total).toBe(1);
    expect(result.covered).toBe(1);
    expect(result.blocking).toEqual([]);
    expect(result.informational).toEqual([]);
  });

  test('[T-002-AC4] blocks uncovered criteria of in-progress or done tickets', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\nF99-S2-AC1\nF99-S3-AC1\n',
      'docs/backlog.md': backlogTable({
        'F99-S1': 'todo',
        'F99-S2': 'done',
        'F99-S3': 'in-progress',
      }),
    });
    const result = runAcCheck(repo);
    expect(result.blocking.map((criterion) => criterion.id).sort()).toEqual([
      'F99-S2-AC1',
      'F99-S3-AC1',
    ]);
    expect(result.informational.map((criterion) => criterion.id)).toEqual(['F99-S1-AC1']);
  });

  test('[T-002-AC4] blocks uncovered technical criteria of an in-progress ticket', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'docs/backlog.md': `${backlogTable({ 'F99-S1': 'todo', 'T-999': 'in-progress' })}- T-999-AC1\n`,
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.blocking.map((criterion) => criterion.id)).toEqual(['T-999-AC1']);
  });

  test('[T-002-AC4] maps UI rules to the status of their story', () => {
    const repo = setup({
      'docs/features/F99.md': 'F99-S1-AC1\n',
      'docs/backlog.md': backlogTable({ 'F99-S1': 'todo', 'F99-S2': 'done' }),
      'docs/design/ecrans.md': [
        '| ID | Règle | Story |',
        '|---|---|---|',
        '| UI-MENU-1 | header | F99-S2 |',
        '| UI-NAME-1 | dialog | F99-S3 |',
        '',
      ].join('\n'),
      'e2e/covered.spec.ts': "test('[F99-S1-AC1] works', () => {});\n",
    });
    const result = runAcCheck(repo);
    expect(result.blocking.map((criterion) => criterion.id)).toEqual(['UI-MENU-1']);
    expect(result.informational.map((criterion) => criterion.id)).toEqual(['UI-NAME-1']);
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
      'docs/backlog.md': backlogTable({ 'F99-S1': 'in-progress' }),
    });
    const result = runAcCheck(repo);
    expect(result.blocking.map((criterion) => criterion.id)).toEqual(['UI-TEST-1']);
  });
});
