import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { installProbe, maximum, median, readLongTasks, resetProbe } from '../support/probe';

test('[F01-S2-AC6] keeps the menu to board transitions free of long tasks', async ({
  page,
}, testInfo) => {
  await installProbe(page);

  const name = `Fluidité ${Date.now()}`;
  const response = await page.request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);

  await page.goto('/');
  const row = page.getByTestId('board-item').filter({ hasText: name });
  await expect(row).toBeVisible();

  const durations: number[] = [];
  const longTasks: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    if (!page.url().endsWith('/')) {
      await page.getByTestId('nav-boards').click();
      await expect(page.getByTestId('board-create')).toBeVisible();
    }
    await resetProbe(page);
    durations.push(
      await measureActionToEffect(
        page,
        () => row.getByRole('link').click(),
        () => expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible(),
      ),
    );
    longTasks.push(...(await readLongTasks(page)));
  }

  const medianOpenMs = median(durations);
  const maxLongTaskMs = maximum(longTasks);
  recordFluidityMeasure({
    requirement: 'FL-7',
    scenario: 'Ouverture d’un board depuis le menu',
    measuredMs: medianOpenMs,
    threshold: '≤ 1000 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-3',
    scenario: 'Transition menu → board (aucune tâche longue > 200 ms)',
    measuredMs: maxLongTaskMs,
    threshold: '≤ 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianOpenMs).toBeLessThanOrEqual(1000);
  expect(maxLongTaskMs).toBeLessThanOrEqual(200);
});
