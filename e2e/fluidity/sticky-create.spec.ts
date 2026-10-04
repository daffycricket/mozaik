import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { median } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type BoardApi = { getElements: () => unknown[] };

async function elementCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

test('[F03-S1-AC4] creates a sticky note within the local feedback target', async ({
  page,
  request,
}, testInfo) => {
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité post-it ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect.poll(() => elementCount(page)).toBe(300);

  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    await page.keyboard.press('n');
    const point = { x: box.x + 300 + run * 80, y: box.y + 250 };
    const expected = 301 + run;
    durations.push(
      await measureActionToEffect(
        page,
        () => page.mouse.click(point.x, point.y),
        async () => {
          await page.waitForFunction((count) => {
            const api = (globalThis as { __board?: BoardApi }).__board;
            return (api?.getElements().length ?? 0) === count;
          }, expected);
        },
      ),
    );
  }

  const medianCreateMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Création d’un post-it sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianCreateMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianCreateMs).toBeLessThanOrEqual(150);
});
