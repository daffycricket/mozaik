import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Criterion,
  collectCoveredCriteria,
  collectCriteria,
  extractTicketStatuses,
} from './acceptance';

export type AcCheckResult = {
  total: number;
  covered: number;
  blocking: Criterion[];
  informational: Criterion[];
};

/**
 * Cross-checks every declared acceptance criterion with the tests that cover it.
 * Uncovered criteria of in-progress or done tickets are blocking; the others are informational.
 */
export function runAcCheck(repoRoot: string): AcCheckResult {
  const criteria = collectCriteria(repoRoot);
  const statuses = extractTicketStatuses(readFileSync(join(repoRoot, 'docs/backlog.md'), 'utf8'));
  const covered = collectCoveredCriteria(repoRoot);
  const blocking: Criterion[] = [];
  const informational: Criterion[] = [];
  let coveredCount = 0;
  for (const criterion of criteria) {
    if (covered.has(criterion.id)) {
      coveredCount += 1;
      continue;
    }
    const status = statuses.get(criterion.ticketId) ?? 'unknown';
    if (status === 'in-progress' || status === 'done') {
      blocking.push(criterion);
    } else {
      informational.push(criterion);
    }
  }
  return { total: criteria.length, covered: coveredCount, blocking, informational };
}
