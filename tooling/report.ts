import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type Criterion, collectCoveredCriteria, collectCriteria } from './acceptance';

export type TestLevelCounts = {
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
};

export type CoverageRow = {
  lines: number | null;
  branches: number | null;
  functions: number | null;
};

export type AcceptanceRow = {
  id: string;
  tests: string;
  status: string;
};

export type ReportInput = {
  ticketId: string;
  stepNumber: number;
  stepTitle: string;
  date: string;
  branch: string;
  parentCommit: string;
  docker: string;
  unit: TestLevelCounts;
  integration: TestLevelCounts;
  e2e: TestLevelCounts;
  coverageGlobal: CoverageRow;
  coverageModel: CoverageRow;
  acceptance: AcceptanceRow[];
  fluidity: string;
  remarks: string;
};

const EMPTY_COUNTS: TestLevelCounts = { passed: 0, failed: 0, skipped: 0, durationMs: 0 };
const EMPTY_COVERAGE: CoverageRow = { lines: null, branches: null, functions: null };

/**
 * Reads the JSON report produced by the Vitest json reporter and splits unit and integration levels.
 */
export function parseVitestResults(path: string): {
  unit: TestLevelCounts;
  integration: TestLevelCounts;
} {
  if (!existsSync(path)) {
    return { unit: { ...EMPTY_COUNTS }, integration: { ...EMPTY_COUNTS } };
  }
  const report = JSON.parse(readFileSync(path, 'utf8')) as {
    testResults?: Array<{
      name?: string;
      startTime?: number;
      endTime?: number;
      assertionResults?: Array<{ status?: string }>;
    }>;
  };
  const unit: TestLevelCounts = { ...EMPTY_COUNTS };
  const integration: TestLevelCounts = { ...EMPTY_COUNTS };
  for (const suite of report.testResults ?? []) {
    const target = suite.name?.includes('.int.test.') ? integration : unit;
    target.durationMs += Math.max(0, (suite.endTime ?? 0) - (suite.startTime ?? 0));
    for (const assertion of suite.assertionResults ?? []) {
      const status = assertion.status ?? 'passed';
      if (status === 'failed') {
        target.failed += 1;
      } else if (status === 'skipped' || status === 'pending' || status === 'todo') {
        target.skipped += 1;
      } else {
        target.passed += 1;
      }
    }
  }
  return { unit, integration };
}

function addCounts(a: TestLevelCounts, b: TestLevelCounts): TestLevelCounts {
  return {
    passed: a.passed + b.passed,
    failed: a.failed + b.failed,
    skipped: a.skipped + b.skipped,
    durationMs: a.durationMs + b.durationMs,
  };
}

/**
 * Loads unit and integration counts, preferring the merged coverage run when it exists.
 */
export function loadVitestCounts(repoRoot: string): {
  unit: TestLevelCounts;
  integration: TestLevelCounts;
} {
  const mergedPath = join(repoRoot, 'coverage/vitest-cov-results.json');
  if (existsSync(mergedPath)) {
    return parseVitestResults(mergedPath);
  }
  const unit = parseVitestResults(join(repoRoot, 'coverage/vitest-results.json'));
  const integration = parseVitestResults(join(repoRoot, 'coverage/vitest-int-results.json'));
  return {
    unit: addCounts(unit.unit, integration.unit),
    integration: addCounts(unit.integration, integration.integration),
  };
}

/**
 * Reads the JSON report produced by the Playwright json reporter.
 */
export function parsePlaywrightResults(path: string): TestLevelCounts {
  if (!existsSync(path)) {
    return { ...EMPTY_COUNTS };
  }
  const report = JSON.parse(readFileSync(path, 'utf8')) as {
    stats?: { expected?: number; unexpected?: number; skipped?: number; duration?: number };
  };
  return {
    passed: report.stats?.expected ?? 0,
    failed: report.stats?.unexpected ?? 0,
    skipped: report.stats?.skipped ?? 0,
    durationMs: report.stats?.duration ?? 0,
  };
}

type CoverageFileSummary = {
  lines?: { pct?: number };
  branches?: { pct?: number };
  functions?: { pct?: number };
};

function toCoverageRow(summary: CoverageFileSummary | undefined): CoverageRow {
  if (summary === undefined) {
    return { ...EMPTY_COVERAGE };
  }
  return {
    lines: summary.lines?.pct ?? null,
    branches: summary.branches?.pct ?? null,
    functions: summary.functions?.pct ?? null,
  };
}

/**
 * Reads the json-summary coverage report and extracts the global and packages/model rows.
 */
export function parseCoverageSummary(path: string): {
  global: CoverageRow;
  model: CoverageRow;
} {
  if (!existsSync(path)) {
    return { global: { ...EMPTY_COVERAGE }, model: { ...EMPTY_COVERAGE } };
  }
  const report = JSON.parse(readFileSync(path, 'utf8')) as Record<string, CoverageFileSummary>;
  const globalRow = toCoverageRow(report.total);
  let lines = 0;
  let linesCovered = 0;
  let branches = 0;
  let branchesCovered = 0;
  let functions = 0;
  let functionsCovered = 0;
  for (const [file, summary] of Object.entries(report)) {
    if (file === 'total' || !file.includes('/packages/model/')) {
      continue;
    }
    const raw = summary as {
      lines?: { total?: number; covered?: number };
      branches?: { total?: number; covered?: number };
      functions?: { total?: number; covered?: number };
    };
    lines += raw.lines?.total ?? 0;
    linesCovered += raw.lines?.covered ?? 0;
    branches += raw.branches?.total ?? 0;
    branchesCovered += raw.branches?.covered ?? 0;
    functions += raw.functions?.total ?? 0;
    functionsCovered += raw.functions?.covered ?? 0;
  }
  const pct = (covered: number, total: number): number | null =>
    total === 0 ? null : (covered / total) * 100;
  return {
    global: globalRow,
    model: {
      lines: pct(linesCovered, lines),
      branches: pct(branchesCovered, branches),
      functions: pct(functionsCovered, functions),
    },
  };
}

function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)} %`;
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function countRow(label: string, counts: TestLevelCounts): string {
  const total = counts.passed + counts.failed;
  return `| ${label} | ${total === 0 ? 0 : counts.passed} | ${counts.failed} | ${counts.skipped} | ${formatDuration(counts.durationMs)} |`;
}

/**
 * Builds the Markdown section of one plan step from the collected results.
 */
export function buildReportSection(input: ReportInput): string {
  const lines: string[] = [];
  lines.push(`## Étape ${input.stepNumber} : ${input.stepTitle}`);
  lines.push('');
  lines.push(`- Date : ${input.date}`);
  lines.push(`- Branche : ${input.branch}`);
  lines.push(`- Commit parent : ${input.parentCommit}`);
  lines.push(`- Docker : ${input.docker}`);
  lines.push('');
  lines.push('| Niveau | Passés | Échoués | Ignorés | Durée |');
  lines.push('|---|---|---|---|---|');
  lines.push(countRow('Unitaire', input.unit));
  lines.push(countRow('Intégration', input.integration));
  lines.push(countRow('End-to-end', input.e2e));
  lines.push('');
  lines.push('| Couverture | Lignes | Branches | Fonctions |');
  lines.push('|---|---|---|---|');
  lines.push(
    `| Global | ${formatPct(input.coverageGlobal.lines)} | ${formatPct(input.coverageGlobal.branches)} | ${formatPct(input.coverageGlobal.functions)} |`,
  );
  lines.push(
    `| packages/model | ${formatPct(input.coverageModel.lines)} | ${formatPct(input.coverageModel.branches)} | ${formatPct(input.coverageModel.functions)} |`,
  );
  lines.push('');
  lines.push('| Critère | Tests | Statut |');
  lines.push('|---|---|---|');
  for (const row of input.acceptance) {
    lines.push(`| ${row.id} | ${row.tests} | ${row.status} |`);
  }
  lines.push('');
  lines.push(`Fluidité : ${input.fluidity}`);
  lines.push('');
  lines.push(`Remarques : ${input.remarks}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Inserts or replaces the section of a step in an existing report, keeping the other steps.
 */
export function upsertSection(existing: string, stepNumber: number, section: string): string {
  const heading = `## Étape ${stepNumber} :`;
  const lines = existing.split('\n');
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start === -1) {
    const base = existing.trimEnd();
    return `${base.length === 0 ? '' : `${base}\n\n`}${section}`;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith('## ')) {
      end = index;
      break;
    }
  }
  const before = lines.slice(0, start).join('\n');
  const after = lines.slice(end).join('\n');
  const prefix = before.trimEnd().length === 0 ? '' : `${before.trimEnd()}\n\n`;
  const suffix = after.trim().length === 0 ? '' : `\n${after.trimStart()}`;
  return `${prefix}${section}${suffix}`;
}

function trailerCount(counts: TestLevelCounts): string {
  const total = counts.passed + counts.failed;
  return `${counts.passed}/${total}`;
}

/**
 * Builds the trailers that the step commit message must carry.
 */
export function buildTrailers(input: ReportInput): string {
  const lines = [
    `Tests: unit ${trailerCount(input.unit)}, integration ${trailerCount(input.integration)}, e2e ${trailerCount(input.e2e)}`,
    `Coverage: lines ${formatPct(input.coverageGlobal.lines)}, branches ${formatPct(input.coverageGlobal.branches)}`,
    `Report: docs/test-reports/${input.ticketId}.md (step ${input.stepNumber})`,
  ];
  return `${lines.join('\n')}\n`;
}

function gitOutput(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '—';
  }
}

function readStepTitle(repoRoot: string, ticketId: string, stepNumber: number): string {
  const planPath = join(repoRoot, 'docs/plans', `${ticketId}.md`);
  if (!existsSync(planPath)) {
    return `Étape ${stepNumber}`;
  }
  const pattern = new RegExp(`^### Étape ${stepNumber} : (.+)$`, 'm');
  const match = pattern.exec(readFileSync(planPath, 'utf8'));
  return match?.[1] ?? `Étape ${stepNumber}`;
}

function buildAcceptanceRows(repoRoot: string, ticketId: string): AcceptanceRow[] {
  const covered = collectCoveredCriteria(repoRoot);
  const criteria = collectCriteria(repoRoot).filter((c: Criterion) => c.ticketId === ticketId);
  return criteria.map((criterion) => {
    const files = covered.get(criterion.id);
    return {
      id: criterion.id,
      tests: files === undefined ? 'aucun' : [...new Set(files)].join(', '),
      status: files === undefined ? 'non couvert' : 'passé',
    };
  });
}

/**
 * Writes the report section of a step and the commit trailers. Returns the section that was written.
 */
export function runReport(repoRoot: string, ticketId: string, stepNumber: number): string {
  const vitest = loadVitestCounts(repoRoot);
  const coverage = parseCoverageSummary(join(repoRoot, 'coverage/coverage-summary.json'));
  const input: ReportInput = {
    ticketId,
    stepNumber,
    stepTitle: readStepTitle(repoRoot, ticketId, stepNumber),
    date: new Date().toISOString(),
    branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']),
    parentCommit: gitOutput(['rev-parse', '--short', 'HEAD']),
    docker: 'non vérifié',
    unit: vitest.unit,
    integration: vitest.integration,
    e2e: parsePlaywrightResults(join(repoRoot, 'test-results/playwright-results.json')),
    coverageGlobal: coverage.global,
    coverageModel: coverage.model,
    acceptance: buildAcceptanceRows(repoRoot, ticketId),
    fluidity: 'aucune mesure de fluidité pour cette étape',
    remarks: '—',
  };
  const section = buildReportSection(input);
  const reportPath = join(repoRoot, 'docs/test-reports', `${ticketId}.md`);
  mkdirSync(dirname(reportPath), { recursive: true });
  const existing = existsSync(reportPath)
    ? readFileSync(reportPath, 'utf8')
    : `# Rapport de test : ${ticketId}\n`;
  writeFileSync(reportPath, upsertSection(existing, stepNumber, section), 'utf8');
  const trailersPath = join(repoRoot, '.git/TRAILERS');
  mkdirSync(dirname(trailersPath), { recursive: true });
  writeFileSync(trailersPath, buildTrailers(input), 'utf8');
  return section;
}
