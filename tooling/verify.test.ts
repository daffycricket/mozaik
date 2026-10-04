import { describe, expect, test } from 'vitest';
import { runVerify, VERIFY_STEPS } from './verify';

describe('[T-002-AC6] verify pipeline', () => {
  test('[T-002-AC6] runs lint, typecheck, coverage, e2e and ac:check in order', () => {
    const seen: string[] = [];
    const code = runVerify(VERIFY_STEPS, (step) => {
      seen.push(step.name);
      return 0;
    });
    expect(code).toBe(0);
    expect(seen).toEqual(['lint', 'typecheck', 'test:cov', 'test:e2e', 'ac:check']);
  });

  test('[T-002-AC6] stops at the first failure and returns its exit code', () => {
    const seen: string[] = [];
    const code = runVerify(VERIFY_STEPS, (step) => {
      seen.push(step.name);
      return step.name === 'test:cov' ? 2 : 0;
    });
    expect(code).toBe(2);
    expect(seen).toEqual(['lint', 'typecheck', 'test:cov']);
  });
});
