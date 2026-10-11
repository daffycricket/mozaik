import { type Criterion, collectCoveredCriteria, collectCriteria } from './acceptance';

export type AcCheckResult = {
  total: number;
  covered: number;
  uncovered: Criterion[];
};

/**
 * Cross-checks every declared acceptance criterion with the tests that cover it.
 * Every criterion present in the documentation describes delivered behaviour, so any
 * uncovered criterion is blocking.
 */
export function runAcCheck(repoRoot: string): AcCheckResult {
  const criteria = collectCriteria(repoRoot);
  const covered = collectCoveredCriteria(repoRoot);
  const uncovered = criteria.filter((criterion) => !covered.has(criterion.id));
  return { total: criteria.length, covered: criteria.length - uncovered.length, uncovered };
}
