export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

const SUBJECT_PATTERN =
  /^(feat|fix|test|refactor|chore|docs|perf|build|revert)\(([a-z][a-z0-9-]*)\): (MZK-\d+)#(\d+) (.+)$/;

/** Scopes of the commits written by the phase scripts (documents, journal, runner metrics). */
const PHASE_SCOPES = new Set([
  'spec',
  'spec-review',
  'design',
  'tech-review',
  'dev',
  'review',
  'merge',
]);

/** Commits of the phase tooling (runner/), written by a human, without ticket nor trailers. */
const TOOLING_SUBJECT = /^(feat|fix|test|refactor|chore|docs|perf|build)\(runner\): \S/;

const STEP_TRAILERS = ['Refs', 'Plan-Step', 'Tests', 'Coverage', 'Report'] as const;

function readTrailers(lines: string[]): Map<string, string> {
  const trailers = new Map<string, string>();
  for (const line of lines) {
    const trailer = /^([A-Za-z][A-Za-z-]*):\s*(.+)$/.exec(line);
    if (trailer !== null) {
      trailers.set(trailer[1] as string, (trailer[2] as string).trim());
    }
  }
  return trailers;
}

/**
 * Validates a commit message against the project git conventions (`docs/process/git.md`).
 * Merge commits are accepted as written by Git, and commits of the phase tooling
 * (`<type>(runner): ...`) need neither ticket nor trailer. Revert commits and phase commits
 * (`docs(spec|spec-review|design|tech-review|dev|review|merge)`) only need the `Refs:` trailer; every
 * other commit is a development step and needs all the step trailers.
 */
export function validateCommitMessage(message: string): ValidationResult {
  const errors: string[] = [];
  const lines = message
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.trimEnd());

  const subject = lines.find((line) => line.trim().length > 0);
  if (subject === undefined) {
    return { valid: false, errors: ['commit message is empty'] };
  }
  if (/^Merge (branch|pull request|remote-tracking branch|tag) /.test(subject.trim())) {
    return { valid: true };
  }
  if (TOOLING_SUBJECT.test(subject.trim())) {
    return { valid: true };
  }

  const match = SUBJECT_PATTERN.exec(subject.trim());
  if (match === null) {
    return {
      valid: false,
      errors: ['subject must match "<type>(<scope>): MZK-<n>#<k> <description>"'],
    };
  }

  const [, type, scope, ticketId] = match;
  const trailers = readTrailers(lines);
  const isPhaseCommit = type === 'docs' && PHASE_SCOPES.has(scope as string);
  const required = type === 'revert' || isPhaseCommit ? (['Refs'] as const) : STEP_TRAILERS;

  for (const key of required) {
    if (!trailers.has(key)) {
      errors.push(`missing trailer "${key}:"`);
    }
  }

  const refs = trailers.get('Refs');
  if (refs !== undefined && refs.split(',')[0]?.trim() !== ticketId) {
    errors.push(`trailer "Refs:" must start with ${ticketId}`);
  }

  const planStep = trailers.get('Plan-Step');
  if (planStep !== undefined && !/^\d+\/\d+$/.test(planStep)) {
    errors.push('trailer "Plan-Step:" must look like "<n>/<total>"');
  }

  const report = trailers.get('Report');
  if (report?.startsWith('n/a')) {
    errors.push('trailer "Report:" must reference a test report');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
