import { execFileSync } from 'node:child_process';

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

export const DOCKER_VERIFY_STEP: VerifyStep = {
  name: 'test:docker',
  command: 'pnpm',
  args: ['test:docker'],
};

/**
 * Adds the Docker image check to the plan when Docker is available (T-005-AC6).
 */
export function buildVerifyPlan(dockerAvailable: boolean): VerifyStep[] {
  return dockerAvailable ? [...VERIFY_STEPS, DOCKER_VERIFY_STEP] : [...VERIFY_STEPS];
}

/**
 * Tells whether the Docker daemon answers, so the image check can be skipped.
 */
export function isDockerAvailable(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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
