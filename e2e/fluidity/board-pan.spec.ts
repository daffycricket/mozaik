import { expect, test } from '@playwright/test';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import {
  frameStatsPerRun,
  installProbe,
  medianOfMaxima,
  readFrameIntervals,
  readLongTasks,
  resetProbe,
} from '../support/probe';

type BoardApi = { getElements: () => unknown[] };

test('[F02-S1-AC4] keeps panning a 300-element board free of jank', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité pan ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
      ),
    )
    .toBe(300);

  const intervalRuns: number[][] = [];
  const longTaskRuns: number[][] = [];
  for (let run = 0; run < 3; run += 1) {
    await resetProbe(page);
    await page.mouse.move(600, 400);
    for (let step = 0; step < 60; step += 1) {
      await page.mouse.wheel(0, 8);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            const browser = globalThis as unknown as {
              requestAnimationFrame: (callback: () => void) => number;
            };
            browser.requestAnimationFrame(() => resolve());
          }),
      );
    }
    intervalRuns.push(await readFrameIntervals(page));
    longTaskRuns.push(await readLongTasks(page));
  }

  const stats = frameStatsPerRun(intervalRuns);
  const maxLongTaskMs = medianOfMaxima(longTaskRuns);
  recordFluidityMeasure({
    requirement: 'FL-2',
    scenario: 'Pan d’un board de 300 éléments',
    measuredMs: stats.medianMs,
    threshold: 'médiane ≤ 33 ms, aucun intervalle > 200 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-3',
    scenario: 'Pan d’un board de 300 éléments (tâche longue max)',
    measuredMs: maxLongTaskMs,
    threshold: '≤ 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(stats.medianMs).toBeLessThanOrEqual(33);
  expect(stats.maxMs).toBeLessThanOrEqual(200);
  expect(maxLongTaskMs).toBeLessThanOrEqual(200);
});
