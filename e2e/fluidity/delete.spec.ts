import { expect, type Page, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { median } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
  worldToScreen: (point: Point) => Point;
};

async function elementCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

async function waitForMissing(page: Page, id: string): Promise<void> {
  await page.waitForFunction((target) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    return api?.getElements().every((element) => element.id !== target) ?? false;
  }, id);
}

async function clickElement(page: Page, element: BoardElement): Promise<void> {
  const screen = await page.evaluate(
    (point) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      if (api === undefined) {
        throw new Error('board API not exposed');
      }
      return api.worldToScreen(point);
    },
    { x: element.x + element.width / 2, y: element.y + element.height / 2 },
  );
  const canvas = await page.getByTestId('board-canvas').boundingBox();
  if (canvas === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.mouse.click(canvas.x + screen.x, canvas.y + screen.y);
}

test('[F08-S1-AC3] deletes an element within the local feedback target', async ({
  page,
  request,
}, testInfo) => {
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité suppression ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect.poll(() => elementCount(page)).toBe(300);

  const targets = await page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().slice(0, 3) ?? [],
  );
  if (targets.length < 3) {
    throw new Error('Expected three sticky notes');
  }

  const durations: number[] = [];
  for (const target of targets) {
    await clickElement(page, target);
    await expect(page.getByTestId('context-bar')).toBeVisible();
    durations.push(
      await measureActionToEffect(
        page,
        () => page.keyboard.press('Delete'),
        () => waitForMissing(page, target.id),
      ),
    );
  }

  const medianDeleteMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Suppression d’un élément sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianDeleteMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianDeleteMs).toBeLessThanOrEqual(150);
});
