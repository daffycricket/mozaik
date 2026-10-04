import { runColorCheck } from './check-colors';

const violations = runColorCheck(process.cwd());

if (violations.length > 0) {
  process.stdout.write('lint: hardcoded colors are not allowed in apps/web/src:\n');
  for (const violation of violations) {
    process.stdout.write(`  - ${violation.file}:${violation.line} ${violation.match}\n`);
  }
  process.exit(1);
}

process.stdout.write('lint: no hardcoded colors\n');
