import { reportRelativePath, runReport } from './report';

const [ticketId, flag, stepRaw] = process.argv.slice(2);

if (ticketId === undefined || flag !== '--step' || stepRaw === undefined) {
  console.error('usage: pnpm report <MZK-ID> --step <n>');
  process.exit(1);
}

const stepNumber = Number(stepRaw);
if (!Number.isInteger(stepNumber) || stepNumber < 1) {
  console.error(`report: invalid step number "${stepRaw}"`);
  process.exit(1);
}

runReport(process.cwd(), ticketId, stepNumber);
process.stdout.write(`report: wrote ${reportRelativePath(ticketId)} (step ${stepNumber})\n`);
