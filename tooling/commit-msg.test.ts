import { describe, expect, test } from 'vitest';
import { validateCommitMessage } from './commit-msg';

const stepCommit = [
  'feat(web): MZK-42#3 ask for confirmation before deleting many elements',
  '',
  'Adds the confirmation dialog above ten selected elements.',
  '',
  'Refs: MZK-42, F08-S1-AC6',
  'Plan-Step: 1/2',
  'Tests: unit 151/151, integration 23/23, e2e 21/21',
  'Coverage: lines 86.9%, branches 81.4%',
  'Report: docs/tickets/MZK-42/rapport.md (step 1)',
].join('\n');

const specCommit = [
  'docs(spec): MZK-42#1 specify confirmation before multiple deletion',
  '',
  'Refs: MZK-42',
].join('\n');

describe('[T-001-AC4] commit message validation', () => {
  test('[T-001-AC4] accepts a development step commit with every trailer', () => {
    expect(validateCommitMessage(stepCommit).valid).toBe(true);
  });

  test('[T-001-AC4] accepts a phase commit of the scripts with only Refs', () => {
    expect(validateCommitMessage(specCommit).valid).toBe(true);
    for (const scope of ['spec-review', 'design', 'tech-review', 'dev', 'review', 'merge']) {
      expect(validateCommitMessage(specCommit.replace('docs(spec)', `docs(${scope})`)).valid).toBe(
        true,
      );
    }
  });

  test('[T-001-AC4] rejects a phase commit without the Refs trailer', () => {
    expect(validateCommitMessage('docs(spec): MZK-42#1 specify the ticket').valid).toBe(false);
  });

  test('[T-001-AC4] requires the step trailers for a docs commit outside the phase scopes', () => {
    const message = specCommit.replace('docs(spec)', 'docs(architecture)');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] accepts a revert commit with only Refs', () => {
    const message = ['revert(web): MZK-42#4 revert step 1', '', 'Refs: MZK-42'].join('\n');
    expect(validateCommitMessage(message).valid).toBe(true);
  });

  test('[T-001-AC4] accepts a merge commit written by Git', () => {
    expect(validateCommitMessage("Merge branch 'ticket/MZK-42-confirm-delete'").valid).toBe(true);
  });

  test('[T-001-AC4] accepts a commit of the phase tooling without ticket nor trailer', () => {
    expect(validateCommitMessage('chore(runner): pin the OpenCode version').valid).toBe(true);
    expect(validateCommitMessage('fix(runner): refuse a launch from a ticket clone').valid).toBe(
      true,
    );
  });

  test('[T-001-AC4] rejects a revert of the phase tooling without ticket', () => {
    expect(validateCommitMessage('revert(runner): undo the guard rule').valid).toBe(false);
  });

  test('[T-001-AC4] rejects a subject without the ticket and commit number', () => {
    expect(validateCommitMessage('chore(tooling): bootstrap the workspace').valid).toBe(false);
  });

  test('[T-001-AC4] rejects a former ticket identifier', () => {
    const message = stepCommit.replace('MZK-42#3', 'F03-S1#2');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects an unknown commit type', () => {
    const message = stepCommit.replace('feat(web)', 'wip(web)');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects a step commit missing all test trailers', () => {
    const message = [
      'chore(tooling): MZK-42#3 adjust the tooling',
      '',
      'Refs: MZK-42',
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

  test('[T-001-AC4] rejects a Refs trailer that does not start with the ticket', () => {
    const message = stepCommit.replace('Refs: MZK-42, F08-S1-AC6', 'Refs: F08-S1-AC6, MZK-42');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-001-AC4] rejects a malformed Plan-Step trailer', () => {
    const message = stepCommit.replace('Plan-Step: 1/2', 'Plan-Step: two');
    expect(validateCommitMessage(message).valid).toBe(false);
  });

  test('[T-002-AC8] rejects an n/a report', () => {
    const message = stepCommit.replace(
      'Report: docs/tickets/MZK-42/rapport.md (step 1)',
      'Report: n/a',
    );
    expect(validateCommitMessage(message).valid).toBe(false);
  });
});
