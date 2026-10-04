export type VerifyStep = {
  name: string;
  command: string;
  args: string[];
};

export const VERIFY_STEPS: VerifyStep[] = [
  { name: 'lint', command: 'pnpm', args: ['lint'] },
  { name: 'typecheck', command: 'pnpm', args: ['typecheck'] },
  { name: 'test:cov', command: 'pnpm', args: ['test:cov'] },
  { name: 'test:e2e', command: 'pnpm', args: ['test:e2e'] },
  { name: 'ac:check', command: 'pnpm', args: ['ac:check'] },
];

/**
 * Runs the verification steps in order and stops at the first failure,
 * returning its exit code (0 when everything passes).
 */
export function runVerify(steps: VerifyStep[], run: (step: VerifyStep) => number): number {
  for (const step of steps) {
    const code = run(step);
    if (code !== 0) {
      return code;
    }
  }
  return 0;
}
