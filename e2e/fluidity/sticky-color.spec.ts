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
  color: string;
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

async function waitForColor(page: Page, id: string, color: string): Promise<void> {
  await page.waitForFunction(
    (target) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      return api?.getElements().find((element) => element.id === target.id)?.color === target.color;
    },
    { id, color },
  );
}

test('[F03-S3-AC3] recolours a sticky note within the local feedback target', async ({
  page,
  request,
}, testInfo) => {
  await addWebSocketLatency(page, 300);

  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité couleur ${Date.now()}`, elements: 300 },
  });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect.poll(() => elementCount(page)).toBe(300);

  const sticky = await page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements()[4],
  );
  if (sticky === undefined) {
    throw new Error('Expected a sticky note');
  }
  const screen = await page.evaluate(
    (point) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      if (api === undefined) {
        throw new Error('board API not exposed');
      }
      return api.worldToScreen(point);
    },
    { x: sticky.x + sticky.width / 2, y: sticky.y + sticky.height / 2 },
  );
  const canvas = await page.getByTestId('board-canvas').boundingBox();
  if (canvas === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.mouse.click(canvas.x + screen.x, canvas.y + screen.y);
  await expect(page.getByTestId('context-bar')).toBeVisible();

  await page.getByTestId('color-purple').click();
  await waitForColor(page, sticky.id, 'purple');

  const colors = ['blue', 'red', 'green'];
  const durations: number[] = [];
  for (const color of colors) {
    durations.push(
      await measureActionToEffect(
        page,
        () => page.getByTestId(`color-${color}`).click(),
        () => waitForColor(page, sticky.id, color),
      ),
    );
  }

  const medianRecolorMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Changement de couleur d’un post-it sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianRecolorMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });

  expect(medianRecolorMs).toBeLessThanOrEqual(150);
});
