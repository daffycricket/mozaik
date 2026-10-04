import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export type CriterionSource = 'feature' | 'tech' | 'ui';

export type Criterion = {
  id: string;
  ticketId: string;
  source: CriterionSource;
};

const FEATURE_ID = /F\d{2}-S\d+-AC\d+/g;
const TECH_ID = /T-\d{3}-AC\d+/g;
const UI_RULE = /\|\s*(UI-[A-Z]+-\d+)\s*\|[^|]*\|\s*(F\d{2}-S\d+)\s*\|/g;
const TEST_ID = /\[((?:F\d{2}-S\d+|T-\d{3}|B-\d{3})-AC\d+|UI-[A-Z]+-\d+)\]/g;
const TICKET_ID = /^(?:F\d{2}-S\d+|T-\d{3}|B-\d{3})$/;
const STATUSES = new Set(['todo', 'in-progress', 'blocked', 'done']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'test-results']);

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Extracts acceptance criteria identifiers from the content of feature files.
 */
export function extractFeatureCriteria(content: string): Criterion[] {
  const ids = content.match(FEATURE_ID) ?? [];
  return unique(ids).map((id) => ({
    id,
    ticketId: id.replace(/-AC\d+$/, ''),
    source: 'feature',
  }));
}

/**
 * Extracts acceptance criteria identifiers of technical tickets from the backlog.
 */
export function extractTechCriteria(content: string): Criterion[] {
  const ids = content.match(TECH_ID) ?? [];
  return unique(ids).map((id) => ({
    id,
    ticketId: id.replace(/-AC\d+$/, ''),
    source: 'tech',
  }));
}

/**
 * Extracts UI rules of the design screens and the story each one belongs to.
 */
export function extractUiRules(content: string): Criterion[] {
  const result: Criterion[] = [];
  for (const match of content.matchAll(UI_RULE)) {
    const id = match[1];
    const ticketId = match[2];
    if (id !== undefined && ticketId !== undefined) {
      result.push({ id, ticketId, source: 'ui' });
    }
  }
  return result;
}

/**
 * Reads the status of every ticket from the backlog table.
 */
export function extractTicketStatuses(content: string): Map<string, string> {
  const statuses = new Map<string, string>();
  for (const line of content.split('\n')) {
    if (!line.trim().startsWith('|')) {
      continue;
    }
    const cells = line.split('|').map((cell) => cell.trim());
    const id = cells[2];
    const status = cells[6];
    if (id !== undefined && status !== undefined && TICKET_ID.test(id) && STATUSES.has(status)) {
      statuses.set(id, status);
    }
  }
  return statuses;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function isTestFile(file: string): boolean {
  return /\.(?:int\.)?test\.tsx?$/.test(file) || /\.spec\.tsx?$/.test(file);
}

/**
 * Maps every acceptance criterion found in a test title to the test files that cover it.
 */
export function collectCoveredCriteria(repoRoot: string): Map<string, string[]> {
  const covered = new Map<string, string[]>();
  for (const file of walk(repoRoot)) {
    if (!isTestFile(file)) {
      continue;
    }
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(TEST_ID)) {
      const id = match[1];
      if (id === undefined) {
        continue;
      }
      const files = covered.get(id) ?? [];
      files.push(relative(repoRoot, file));
      covered.set(id, files);
    }
  }
  return covered;
}

/**
 * Reads all criteria declared by the features, the design screens and the technical tickets.
 */
export function collectCriteria(repoRoot: string): Criterion[] {
  const criteria: Criterion[] = [];
  const featuresDir = join(repoRoot, 'docs/features');
  if (existsSync(featuresDir)) {
    for (const entry of readdirSync(featuresDir)) {
      if (entry.endsWith('.md') && entry !== 'README.md' && entry !== '_template.md') {
        criteria.push(...extractFeatureCriteria(readFileSync(join(featuresDir, entry), 'utf8')));
      }
    }
  }
  const backlogPath = join(repoRoot, 'docs/backlog.md');
  if (existsSync(backlogPath)) {
    criteria.push(...extractTechCriteria(readFileSync(backlogPath, 'utf8')));
  }
  const ecransPath = join(repoRoot, 'docs/design/ecrans.md');
  if (existsSync(ecransPath)) {
    criteria.push(...extractUiRules(readFileSync(ecransPath, 'utf8')));
  }
  return criteria;
}
