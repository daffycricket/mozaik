import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { median } from '../support/probe';

test('[T-004-AC6] opens an empty board within the fluidity target', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('board-create')).toBeVisible();

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    await page.goto('/');
    durations.push(
      await measureActionToEffect(
        page,
        () => page.getByTestId('board-create').click(),
        () => {
          const browser = globalThis as unknown as {
            document: {
              querySelector: (selector: string) => {
                getBoundingClientRect: () => { width: number; height: number };
              } | null;
            };
            getComputedStyle: (element: unknown) => { visibility: string };
          };
          const canvas = browser.document.querySelector('[data-testid="board-canvas"] canvas');
          if (canvas === null) {
            return false;
          }
          const rect = canvas.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            return false;
          }
          return browser.getComputedStyle(canvas).visibility !== 'hidden';
        },
      ),
    );
  }

  const medianOpenMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-7',
    scenario: 'Ouverture d’un board vide depuis le menu',
    measuredMs: medianOpenMs,
    threshold: '≤ 1000 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianOpenMs).toBeLessThanOrEqual(1000);
});
