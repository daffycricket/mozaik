import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  buildReportSection,
  buildTrailers,
  loadVitestCounts,
  parseCoverageSummary,
  parsePlaywrightResults,
  parseVitestResults,
  type ReportInput,
  runReport,
  upsertSection,
} from './report';

let dir = '';

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'mozaik-report-'));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(name: string, value: unknown): string {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value), 'utf8');
  return path;
}

const baseInput: ReportInput = {
  ticketId: 'T-002',
  stepNumber: 1,
  stepTitle: 'Outil de rapport',
  date: '2026-10-04T10:00:00.000Z',
  branch: 'chore/T-002-test-harness',
  parentCommit: 'abc1234',
  docker: 'non vérifié',
  unit: { passed: 12, failed: 0, skipped: 0, durationMs: 1200 },
  integration: { passed: 3, failed: 0, skipped: 0, durationMs: 4000 },
  e2e: { passed: 1, failed: 0, skipped: 0, durationMs: 3000 },
  coverageGlobal: { lines: 85.4, branches: 80.1, functions: 90 },
  coverageModel: { lines: 95, branches: 92, functions: 100 },
  acceptance: [{ id: 'T-002-AC5', tests: 'tooling/report.test.ts', status: 'passé' }],
  fluidity: 'aucune',
  remarks: '—',
};

describe('[T-002-AC5] report tool', () => {
  test('[T-002-AC5] splits unit and integration results from the Vitest json report', () => {
    const path = write('vitest.json', {
      testResults: [
        {
          name: '/repo/apps/web/src/app.test.tsx',
          startTime: 0,
          endTime: 1000,
          assertionResults: [{ status: 'passed' }, { status: 'passed' }],
        },
        {
          name: '/repo/apps/server/test/health.int.test.ts',
          startTime: 0,
          endTime: 2000,
          assertionResults: [{ status: 'passed' }],
        },
        {
          name: '/repo/apps/server/test/other.int.test.ts',
          startTime: 0,
          endTime: 500,
          assertionResults: [{ status: 'failed' }, { status: 'skipped' }],
        },
      ],
    });
    const result = parseVitestResults(path);
    expect(result.unit.passed).toBe(2);
    expect(result.integration.passed).toBe(1);
    expect(result.integration.failed).toBe(1);
    expect(result.integration.skipped).toBe(1);
    expect(result.integration.durationMs).toBe(2500);
  });

  test('[T-002-AC5] merges the separate unit and integration result files', () => {
    const repo = mkdtempSync(join(tmpdir(), 'mozaik-merge-'));
    mkdirSync(join(repo, 'coverage'), { recursive: true });
    writeFileSync(
      join(repo, 'coverage/vitest-results.json'),
      JSON.stringify({
        testResults: [
          {
            name: '/repo/apps/web/src/app.test.tsx',
            assertionResults: [{ status: 'passed' }],
          },
        ],
      }),
      'utf8',
    );
    writeFileSync(
      join(repo, 'coverage/vitest-int-results.json'),
      JSON.stringify({
        testResults: [
          {
            name: '/repo/apps/server/test/health.int.test.ts',
            assertionResults: [{ status: 'passed' }, { status: 'passed' }],
          },
        ],
      }),
      'utf8',
    );
    const counts = loadVitestCounts(repo);
    expect(counts.unit.passed).toBe(1);
    expect(counts.integration.passed).toBe(2);
    rmSync(repo, { recursive: true, force: true });
  });

  test('[T-002-AC5] reads the Playwright json report', () => {
    const path = write('playwright.json', {
      stats: { expected: 4, unexpected: 1, skipped: 0, duration: 2500 },
    });
    expect(parsePlaywrightResults(path)).toEqual({
      passed: 4,
      failed: 1,
      skipped: 0,
      durationMs: 2500,
    });
  });

  test('[T-002-AC5] aggregates the packages/model coverage', () => {
    const path = write('coverage-summary.json', {
      total: {
        lines: { pct: 85 },
        branches: { pct: 80 },
        functions: { pct: 90 },
      },
      '/repo/packages/model/src/index.ts': {
        lines: { total: 10, covered: 9, pct: 90 },
        branches: { total: 4, covered: 3, pct: 75 },
        functions: { total: 2, covered: 2, pct: 100 },
      },
    });
    const result = parseCoverageSummary(path);
    expect(result.global.lines).toBe(85);
    expect(result.model.lines).toBe(90);
    expect(result.model.branches).toBe(75);
  });

  test('[T-002-AC5] degrades gracefully when a report is missing', () => {
    const missing = join(dir, 'nope.json');
    expect(parseVitestResults(missing).unit.passed).toBe(0);
    expect(parsePlaywrightResults(missing).passed).toBe(0);
    expect(parseCoverageSummary(missing).global.lines).toBeNull();
  });

  test('[T-002-AC5] builds a section with the step title, counts, coverage and criteria', () => {
    const section = buildReportSection(baseInput);
    expect(section).toContain('## Étape 1 : Outil de rapport');
    expect(section).toContain('| Unitaire | 12 | 0 | 0 | 1.2 s |');
    expect(section).toContain('| Global | 85.4 % | 80.1 % | 90.0 % |');
    expect(section).toContain('| T-002-AC5 | tooling/report.test.ts | passé |');
  });

  test('[T-002-AC5] appends a new section and replaces an existing one', () => {
    const appended = upsertSection('# Rapport de test : T-002\n', 1, buildReportSection(baseInput));
    expect(appended).toContain('## Étape 1 : Outil de rapport');

    const second: ReportInput = { ...baseInput, stepNumber: 2, stepTitle: 'Deuxième' };
    const replaced = upsertSection(appended, 2, buildReportSection(second));
    expect(replaced).toContain('## Étape 1 : Outil de rapport');
    expect(replaced).toContain('## Étape 2 : Deuxième');

    const third: ReportInput = { ...baseInput, stepNumber: 1, stepTitle: 'Révisé' };
    const updated = upsertSection(replaced, 1, buildReportSection(third));
    expect(updated).toContain('## Étape 1 : Révisé');
    expect(updated).not.toContain('Outil de rapport');
    expect(updated).toContain('## Étape 2 : Deuxième');
  });

  test('[T-002-AC5] builds the test and coverage trailers of the commit', () => {
    const trailers = buildTrailers(baseInput);
    expect(trailers).toContain('Tests: unit 12/12, integration 3/3, e2e 1/1');
    expect(trailers).toContain('Coverage: lines 85.4 %, branches 80.1 %');
    expect(trailers).toContain('Report: docs/test-reports/T-002.md (step 1)');
  });

  test('[T-002-AC5] writes the report file and the trailers', () => {
    const repo = mkdtempSync(join(tmpdir(), 'mozaik-report-repo-'));
    writeFileSync(join(repo, 'placeholder'), '', 'utf8');
    const section = runReport(repo, 'T-002', 1);
    expect(section).toContain('## Étape 1');
    const report = readFileSync(join(repo, 'docs/test-reports/T-002.md'), 'utf8');
    expect(report).toContain('# Rapport de test : T-002');
    const trailers = readFileSync(join(repo, '.git/TRAILERS'), 'utf8');
    expect(trailers).toContain('Report: docs/test-reports/T-002.md (step 1)');
    rmSync(repo, { recursive: true, force: true });
  });
});
