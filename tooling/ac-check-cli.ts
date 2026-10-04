import { runAcCheck } from './ac-check';

const result = runAcCheck(process.cwd());
process.stdout.write(`ac:check: ${result.covered}/${result.total} criteria covered by tests\n`);

if (result.informational.length > 0) {
  process.stdout.write('ac:check: uncovered criteria of non-blocking tickets:\n');
  for (const criterion of result.informational) {
    process.stdout.write(`  (info) ${criterion.id} [${criterion.ticketId}]\n`);
  }
}

if (result.blocking.length > 0) {
  process.stdout.write('ac:check: uncovered criteria of in-progress or done tickets:\n');
  for (const criterion of result.blocking) {
    process.stdout.write(`  - ${criterion.id} [${criterion.ticketId}]\n`);
  }
  process.exit(1);
}

process.stdout.write('ac:check: ok\n');
