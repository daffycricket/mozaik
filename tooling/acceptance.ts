import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export type CriterionSource = 'feature' | 'tech' | 'ui';

export type Criterion = {
  id: string;
  ticketId: string;
  source: CriterionSource;
};

const FEATURE_ID = /F\d{2}-S\d+-AC\d+/g;
const TECH_ID = /(?:T|B)-\d{3}-AC\d+/g;
const UI_RULE = /\|\s*(UI-[A-Z]+-\d+)\s*\|[^|]*\|\s*(F\d{2}-S\d+)\s*\|/g;
const TEST_ID = /\[((?:F\d{2}-S\d+|T-\d{3}|B-\d{3})-AC\d+|UI-[A-Z]+-\d+)\]/g;
const CRITERION_ID = /\b(?:(?:F\d{2}-S\d+|T-\d{3}|B-\d{3})-AC\d+|UI-[A-Z]+-\d+)\b/g;
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
 * Extracts the technical requirements and bug regression criteria declared in
 * `docs/exigences-techniques.md`.
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
 * Lists, in order of appearance and without duplicates, the criterion identifiers
 * mentioned in a text (features, technical requirements, bug criteria and UI rules).
 */
export function extractCriterionIds(content: string): string[] {
  return unique(content.match(CRITERION_ID) ?? []);
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
 * Reads all criteria declared by the features, the design screens and the technical requirements.
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
  const requirementsPath = join(repoRoot, 'docs/exigences-techniques.md');
  if (existsSync(requirementsPath)) {
    criteria.push(...extractTechCriteria(readFileSync(requirementsPath, 'utf8')));
  }
  const ecransPath = join(repoRoot, 'docs/design/ecrans.md');
  if (existsSync(ecransPath)) {
    criteria.push(...extractUiRules(readFileSync(ecransPath, 'utf8')));
  }
  return criteria;
}
