export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

const SUBJECT_PATTERN =
  /^(feat|fix|test|refactor|chore|docs|perf|build|revert)\(([a-z][a-z0-9-]*)\): (F\d{2}-S\d+|T-\d{3}|B-\d{3}|RUN)#(\d+) (.+)$/;

const REQUIRED_TRAILERS = ['Refs', 'Plan-Step', 'Tests', 'Coverage', 'Report'] as const;

/**
 * Validates a commit message against the project git conventions.
 * Step 0 (plan) and revert commits are exempt from the test trailers.
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

  const match = SUBJECT_PATTERN.exec(subject.trim());
  if (match === null) {
    return {
      valid: false,
      errors: ['subject must match "<type>(<scope>): <TICKET-ID>#<n> <description>"'],
    };
  }

  const [, type, , ticketId, step] = match;
  const requiresTrailers = Number(step) !== 0 && type !== 'revert';
  if (!requiresTrailers) {
    return { valid: true };
  }

  const trailers = new Map<string, string>();
  for (const line of lines) {
    const trailer = /^([A-Za-z][A-Za-z-]*):\s*(.+)$/.exec(line);
    if (trailer !== null) {
      trailers.set(trailer[1] as string, (trailer[2] as string).trim());
    }
  }

  for (const key of REQUIRED_TRAILERS) {
    if (!trailers.has(key)) {
      errors.push(`missing trailer "${key}:"`);
    }
  }

  const refs = trailers.get('Refs');
  if (refs !== undefined && refs !== ticketId) {
    errors.push(`trailer "Refs:" must reference ${ticketId}`);
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
