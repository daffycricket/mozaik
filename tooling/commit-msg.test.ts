import { describe, expect, test } from 'vitest';
import { validateCommitMessage } from './commit-msg';

const stepCommit = [
  'feat(web): F03-S1#2 create sticky note on toolbar click',
  '',
  'Adds the sticky tool and creation at the click position.',
  '',
  'Refs: F03-S1',
  'Plan-Step: 2/4',
  'Tests: unit 151/151, integration 23/23, e2e 21/21',
  'Coverage: lines 86.9%, branches 81.4%',
  'Report: docs/test-reports/F03-S1.md (step 2)',
].join('\n');

describe('[T-001-AC4] commit message validation', () => {
  test('[T-001-AC4] accepts the step 0 plan commit without test trailers', () => {
    expect(validateCommitMessage('docs(plan): T-001#0 plan 3 steps').valid).toBe(true);
  });

  test('[T-001-AC4] accepts the final run bilan commit', () => {
    expect(validateCommitMessage('docs(journal): RUN#0 bilan').valid).toBe(true);
  });

  test('[T-001-AC4] accepts a step commit with every trailer', () => {
    expect(validateCommitMessage(stepCommit).valid).toBe(true);
  });

  test('[T-001-AC4] accepts a revert commit without test trailers', () => {
    expect(validateCommitMessage('revert(tooling): T-001#2 revert step 2').valid).toBe(true);
  });

  test('[T-001-AC4] rejects a subject without the ticket and step number', () => {
    expect(validateCommitMessage('chore(tooling): bootstrap the workspace').valid).toBe(false);
  });

  test('[T-001-AC4] rejects an unknown commit type', () => {
    expect(validateCommitMessage('wip(tooling): T-001#1 bootstrap the workspace').valid).toBe(
      false,
    );
  });

  test('[T-001-AC4] rejects a step commit missing all test trailers', () => {
    const message = [
      'chore(tooling): T-001#1 bootstrap the workspace',
      '',
      'Refs: T-001',
      'Plan-Step: 1/3',
    ].join('\n');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects a step commit missing a single trailer', () => {
    const message = stepCommit
      .split('\n')
      .filter((line) => !line.startsWith('Report:'))
      .join('\n');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects a Refs trailer that does not match the ticket', () => {
    const message = stepCommit.replace('Refs: F03-S1', 'Refs: F03-S2');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects a malformed Plan-Step trailer', () => {
    const message = stepCommit.replace('Plan-Step: 2/4', 'Plan-Step: two');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-002-AC8] rejects an n/a report even for the bootstrap ticket', () => {
    const message = stepCommit
      .replaceAll('F03-S1', 'T-001')
      .replace('docs/test-reports/T-001.md (step 2)', 'n/a (T-002)');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects an n/a report for another ticket', () => {
    const message = stepCommit.replace(
      'Report: docs/test-reports/F03-S1.md (step 2)',
      'Report: n/a (T-002)',
    );
    expect(validateCommitMessage(message).valid).toBe(false);
  });
});
