import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { frameStats, installProbe, median, readFrameIntervals, resetProbe } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type DraftShape =
  | { type: 'rect' | 'ellipse'; x: number; y: number; width: number; height: number }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number };

type BoardApi = {
  getElements: () => unknown[];
  getDraftShape: () => DraftShape | null;
};

async function elementCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

async function draftLength(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const draft = (globalThis as { __board?: BoardApi }).__board?.getDraftShape();
    if (draft === undefined || draft === null || draft.type !== 'arrow') {
      return 0;
    }
    return Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
  });
}

async function frame(page: import('@playwright/test').Page): Promise<void> {
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

test('[F06-S1-AC4] draws an arrow following the pointer within the fluidity targets', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité flèche ${Date.now()}`, elements: 300 },
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
  const start = { x: box.x + 200, y: box.y + 200 };

  await page.keyboard.press('a');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y + 20);
  await expect.poll(() => draftLength(page)).toBeGreaterThan(0);

  const durations: number[] = [];
  let previousLength = await draftLength(page);
  for (let run = 0; run < 3; run += 1) {
    const target = { x: start.x + 100 + run * 40, y: start.y + 60 };
    durations.push(
      await measureActionToEffect(
        page,
        () => page.mouse.move(target.x, target.y),
        (minLength: number) => {
          const draft = (globalThis as { __board?: BoardApi }).__board?.getDraftShape();
          if (draft === null || draft === undefined || draft.type !== 'arrow') {
            return false;
          }
          return Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > minLength;
        },
        previousLength,
      ),
    );
    previousLength = await draftLength(page);
  }

  const intervals: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    await resetProbe(page);
    for (let step = 0; step < 60; step += 1) {
      await page.mouse.move(start.x + 100 + step * 2, start.y + 60 + step);
      await frame(page);
    }
    intervals.push(...(await readFrameIntervals(page)));
  }

  await page.mouse.up();
  await expect.poll(() => elementCount(page)).toBe(301);

  const stats = frameStats(intervals);
  const medianDraftMs = median(durations);

  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario:
      'Tracé d’une flèche suivant le pointeur sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianDraftMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-2',
    scenario: 'Glisser de tracé d’une flèche sur un board de 300 éléments',
    measuredMs: stats.medianMs,
    threshold: 'médiane ≤ 33 ms, aucun intervalle > 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianDraftMs).toBeLessThanOrEqual(150);
  expect(stats.medianMs).toBeLessThanOrEqual(33);
  expect(stats.maxMs).toBeLessThanOrEqual(200);
});
