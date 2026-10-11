import { runAcCheck } from './ac-check';

const result = runAcCheck(process.cwd());
process.stdout.write(`ac:check: ${result.covered}/${result.total} criteria covered by tests\n`);

if (result.uncovered.length > 0) {
  process.stdout.write('ac:check: uncovered criteria:\n');
  for (const criterion of result.uncovered) {
    process.stdout.write(`  - ${criterion.id} [${criterion.ticketId}]\n`);
  }
  process.exit(1);
}

process.stdout.write('ac:check: ok\n');
