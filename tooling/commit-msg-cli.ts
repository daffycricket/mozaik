import { readFileSync } from 'node:fs';
import { validateCommitMessage } from './commit-msg';

const messageFile = process.argv[2];

if (messageFile === undefined) {
  console.error('commit-msg: missing commit message file path');
  process.exit(1);
}

const result = validateCommitMessage(readFileSync(messageFile, 'utf8'));

if (!result.valid) {
  console.error('commit-msg: invalid commit message');
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}
