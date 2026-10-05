import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { frameStats, installProbe, median, readFrameIntervals, resetProbe } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
  worldToScreen: (point: Point) => Point;
};

async function elements(page: import('@playwright/test').Page): Promise<BoardElement[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getElements() ?? []);
}

async function elementById(
  page: import('@playwright/test').Page,
  id: string,
): Promise<BoardElement> {
  const [element] = (await elements(page)).filter((candidate) => candidate.id === id);
  if (element === undefined) {
    throw new Error(`Expected element ${id}`);
  }
  return element;
}

async function pagePoint(page: import('@playwright/test').Page, world: Point): Promise<Point> {
  const screen = await page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, world);
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { x: box.x + screen.x, y: box.y + screen.y };
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

test('[F06-S2-AC3] drags an arrow endpoint on a 300-element board within the fluidity targets', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité flèche extrémité ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect.poll(async () => (await elements(page)).length).toBe(300);

  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.keyboard.press('a');
  await page.mouse.move(box.x + 200, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 500, box.y + 360, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await elements(page)).length).toBe(301);

  const arrow = (await elements(page)).find((element) => element.type === 'arrow');
  if (arrow === undefined) {
    throw new Error('Expected an arrow');
  }

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const before = await elementById(page, arrow.id);
    const handle = await pagePoint(page, { x: before.x2 ?? 0, y: before.y2 ?? 0 });
    durations.push(
      await measureActionToEffect(
        page,
        async () => {
          await page.mouse.move(handle.x, handle.y);
          await page.mouse.down();
          await page.mouse.move(handle.x + 30, handle.y + 20, { steps: 2 });
        },
        () =>
          expect
            .poll(async () => (await elementById(page, arrow.id)).x2 ?? 0)
            .toBeGreaterThan(before.x2 ?? 0),
      ),
    );
    await page.mouse.up();
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await elementById(page, arrow.id)).x2).toBe(before.x2);
  }

  const intervals: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const before = await elementById(page, arrow.id);
    const handle = await pagePoint(page, { x: before.x2 ?? 0, y: before.y2 ?? 0 });
    await resetProbe(page);
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    for (let step = 0; step < 60; step += 1) {
      await page.mouse.move(handle.x + step, handle.y + step / 2);
      await frame(page);
    }
    await page.mouse.up();
    intervals.push(...(await readFrameIntervals(page)));
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await elementById(page, arrow.id)).x2).toBe(before.x2);
  }

  const stats = frameStats(intervals);
  const medianDragMs = median(durations);

  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Glisser d’une extrémité de flèche sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianDragMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-2',
    scenario: 'Glisser d’une extrémité de flèche sur un board de 300 éléments',
    measuredMs: stats.medianMs,
    threshold: 'médiane ≤ 33 ms, aucun intervalle > 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianDragMs).toBeLessThanOrEqual(150);
  expect(stats.medianMs).toBeLessThanOrEqual(33);
  expect(stats.maxMs).toBeLessThanOrEqual(200);
});
