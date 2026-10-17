import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { installProbe, median, medianOfMaxima, readLongTasks, resetProbe } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Viewport = { x: number; y: number; zoom: number };
type BoardApi = { getElements: () => unknown[]; getViewport: () => Viewport };

async function viewport(page: import('@playwright/test').Page): Promise<Viewport> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getViewport();
  });
}

test('[F02-S4-AC4] fits a 300-element board within the fluidity targets', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité recadrage ${Date.now()}`, elements: 300 },
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

  const durations: number[] = [];
  const longTaskRuns: number[][] = [];
  for (let run = 0; run < 3; run += 1) {
    await page.keyboard.press('Control+=');
    await page.keyboard.press('Control+=');
    const before = await viewport(page);
    await resetProbe(page);
    durations.push(
      await measureActionToEffect(
        page,
        () => page.keyboard.press('Shift+Digit1'),
        (previous: Viewport) => {
          const api = (globalThis as { __board?: BoardApi }).__board;
          if (api === undefined) {
            return false;
          }
          const current = api.getViewport();
          return (
            current.x !== previous.x || current.y !== previous.y || current.zoom !== previous.zoom
          );
        },
        before,
      ),
    );
    longTaskRuns.push(await readLongTasks(page));
  }

  const medianFitMs = median(durations);
  const maxLongTaskMs = medianOfMaxima(longTaskRuns);

  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Recadrage d’un board de 300 éléments (300 ms de latence)',
    measuredMs: medianFitMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-3',
    scenario: 'Recadrage d’un board de 300 éléments (tâche longue max)',
    measuredMs: maxLongTaskMs,
    threshold: '≤ 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianFitMs).toBeLessThanOrEqual(150);
  expect(maxLongTaskMs).toBeLessThanOrEqual(200);
});
