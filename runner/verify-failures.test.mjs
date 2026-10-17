// Tests de l'extraction des échecs de vérification : node --test runner/verify-failures.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { failureItems, failureMessage } from './verify-failures.mjs';

// Fin de sortie réelle de la vérification de MZK-1, session 1
const playwright = `  ✓  151 [layout] › e2e/layout/viewports.spec.ts:6:3 › layout reference viewport 1280x800 › [T-006-AC4] runs the layout project at 1280x800 (45ms)

  1) [fluidity] › e2e/fluidity/arrow-edit.spec.ts:64:1 › [F06-S2-AC3] drags an arrow endpoint on a 300-element board within the fluidity targets 

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 150
    Received:    160.10000002384186

  1 failed
    [fluidity] › e2e/fluidity/arrow-edit.spec.ts:64:1 › [F06-S2-AC3] drags an arrow endpoint on a 300-element board within the fluidity targets 
  151 passed (2.7m)
[WebServer] Error: read ECONNRESET
[ELIFECYCLE] Command failed with exit code 1.`;

test('playwright : tests du résumé « failed », pas les tests passés ni les erreurs', () => {
  assert.deepEqual(failureItems('test:e2e', playwright), {
    items: [
      '[fluidity] › e2e/fluidity/arrow-edit.spec.ts:64:1 › [F06-S2-AC3] drags an arrow endpoint on a 300-element board within the fluidity targets',
    ],
    total: 1,
  });
});

test('playwright : plusieurs échecs, flaky ignorés', () => {
  const out = `  2 failed
    [chromium] › e2e/a.spec.ts:3:1 › [F01-S1-AC1] a
    [chromium] › e2e/b.spec.ts:9:1 › [F01-S1-AC2] b
  1 flaky
    [chromium] › e2e/c.spec.ts:4:1 › c
  40 passed (1.0m)`;
  assert.deepEqual(failureItems('test:e2e', out).items, [
    '[chromium] › e2e/a.spec.ts:3:1 › [F01-S1-AC1] a',
    '[chromium] › e2e/b.spec.ts:9:1 › [F01-S1-AC2] b',
  ]);
});

test('vitest : lignes FAIL dédoublonnées', () => {
  const out = ` ❯ packages/model/src/viewport-fit.test.ts (5 tests | 1 failed) 12ms
   × fitViewport > [F02-S4-AC1] centers the content 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |unit| packages/model/src/viewport-fit.test.ts > fitViewport > [F02-S4-AC1] centers the content
AssertionError: expected 1 to be 2

 Test Files  1 failed | 96 passed (97)`;
  assert.deepEqual(failureItems('test:cov', out).items, [
    '|unit| packages/model/src/viewport-fit.test.ts > fitViewport > [F02-S4-AC1] centers the content',
  ]);
});

test('typecheck : erreurs TS', () => {
  const out = `apps/web/src/tools/shortcuts.ts(140,7): error TS2345: Argument of type 'Element[]' is not assignable.
 ELIFECYCLE  Command failed with exit code 2.`;
  assert.deepEqual(failureItems('typecheck', out).items, [
    "apps/web/src/tools/shortcuts.ts(140,7): error TS2345: Argument of type 'Element[]' is not assignable.",
  ]);
});

test('lint : diagnostics Biome', () => {
  const out = `apps/web/src/a.ts:3:1 lint/suspicious/noConsole ━━━━━━━━━━

  ✖ Don't use console.

apps/web/src/b.ts format ━━━━━━━━━━

Checked 300 files in 1s. Found 2 errors.`;
  assert.deepEqual(failureItems('lint', out).items, [
    'apps/web/src/a.ts:3:1 lint/suspicious/noConsole',
    'apps/web/src/b.ts format',
  ]);
});

test('ac:check : critères non couverts', () => {
  const out = `ac:check: 170/171 criteria covered by tests
ac:check: uncovered criteria:
  - F02-S4-AC3 [F02-S4]`;
  assert.deepEqual(failureItems('ac:check', out).items, ['F02-S4-AC3 [F02-S4]']);
});

test('format inconnu : dernières lignes non vides', () => {
  const out = 'a\n\nb\nERR_PNPM_LOCKFILE out of date\n';
  assert.deepEqual(failureItems('install', out).items, ['a', 'b', 'ERR_PNPM_LOCKFILE out of date']);
});

test('message : au plus 10 éléments, nombre des autres', () => {
  const lines = Array.from({ length: 12 }, (_, i) => ` FAIL  t${i}.test.ts > x`).join('\n');
  const m = failureMessage('test:cov', 1, lines);
  assert.match(m, /^test:cov : échec \(code 1\) : t0\.test\.ts > x \| /);
  assert.match(m, /t9\.test\.ts > x \(et 2 autre\(s\)\)$/);
  assert.doesNotMatch(m, /t10\.test/);
});

test('message : sortie vide', () => {
  assert.equal(failureMessage('lint', 1, ''), 'lint : échec (code 1)');
});
