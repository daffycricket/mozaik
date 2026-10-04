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
        () => expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible(),
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
