import { execFileSync } from 'node:child_process';
import { buildVerifyPlan, isDockerAvailable, runVerify } from './verify';

const dockerAvailable = isDockerAvailable();
if (!dockerAvailable) {
  process.stderr.write('verify: Docker is not available, skipping test:docker\n');
}

const exitCode = runVerify(buildVerifyPlan(dockerAvailable), (step) => {
  process.stdout.write(`\nverify: ${step.name}\n`);
  try {
    execFileSync(step.command, step.args, { stdio: 'inherit' });
    return 0;
  } catch (error) {
    const failure = error as { status?: number | null };
    return failure.status ?? 1;
  }
});

if (exitCode !== 0) {
  process.stdout.write(`\nverify: failed (exit code ${exitCode})\n`);
}

process.exit(exitCode);
