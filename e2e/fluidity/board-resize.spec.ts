import { expect, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import {
  frameStats,
  installProbe,
  median,
  readFrameIntervals,
  readLongTasks,
  resetProbe,
} from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Point = { x: number; y: number };
type BoardElement = { id: string; x: number; y: number; width: number; height: number };

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
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

async function selection(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
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

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

function bottomRight(element: BoardElement): Point {
  return { x: element.x + element.width, y: element.y + element.height };
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

test('[F07-S3-AC4] keeps resizing on a 300-element board within the fluidity targets', async ({
  page,
  request,
}, testInfo) => {
  await installProbe(page);
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité redimensionnement ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect.poll(async () => (await elements(page)).length).toBe(300);

  const [target] = await elements(page);
  if (target === undefined) {
    throw new Error('Expected a seeded element');
  }

  const select = await pagePoint(page, center(target));
  await page.mouse.click(select.x, select.y);
  await expect.poll(() => selection(page)).toEqual([target.id]);

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const before = await elementById(page, target.id);
    const handle = await pagePoint(page, bottomRight(before));
    durations.push(
      await measureActionToEffect(
        page,
        async () => {
          await page.mouse.move(handle.x, handle.y);
          await page.mouse.down();
          await page.mouse.move(handle.x + 30, handle.y + 20, { steps: 2 });
        },
        (resized: { id: string; minWidth: number }) => {
          const api = (globalThis as { __board?: BoardApi }).__board;
          const element = api?.getElements().find((candidate) => candidate.id === resized.id);
          return (element?.width ?? 0) > resized.minWidth;
        },
        { id: target.id, minWidth: before.width + 5 },
      ),
    );
    await page.mouse.up();
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await elementById(page, target.id)).width).toBe(before.width);
  }

  const intervals: number[] = [];
  const longTasks: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const before = await elementById(page, target.id);
    const handle = await pagePoint(page, bottomRight(before));
    await resetProbe(page);
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    for (let step = 0; step < 60; step += 1) {
      await page.mouse.move(handle.x + step, handle.y + step / 2);
      await frame(page);
    }
    await page.mouse.up();
    intervals.push(...(await readFrameIntervals(page)));
    longTasks.push(...(await readLongTasks(page)));
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await elementById(page, target.id)).width).toBe(before.width);
  }

  const stats = frameStats(intervals);
  const maxLongTaskMs = longTasks.reduce((max, value) => (value > max ? value : max), 0);
  const medianResizeMs = median(durations);

  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Redimensionnement d’un élément sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianResizeMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-2',
    scenario: 'Redimensionnement d’un élément sur un board de 300 éléments',
    measuredMs: stats.medianMs,
    threshold: 'médiane ≤ 33 ms, aucun intervalle > 200 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-3',
    scenario: 'Redimensionnement d’un élément sur un board de 300 éléments (tâche longue max)',
    measuredMs: maxLongTaskMs,
    threshold: '≤ 200 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianResizeMs).toBeLessThanOrEqual(150);
  expect(stats.medianMs).toBeLessThanOrEqual(33);
  expect(stats.maxMs).toBeLessThanOrEqual(200);
  expect(maxLongTaskMs).toBeLessThanOrEqual(200);
});
