import { expect, type Page, test } from '@playwright/test';

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
  getSelection: () => string[];
  screenToWorld: (point: Point) => Point;
  worldToScreen: (point: Point) => Point;
};

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

async function elements(page: Page): Promise<BoardElement[]> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getElements();
  });
}

async function screenToWorld(page: Page, point: Point): Promise<Point> {
  return page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.screenToWorld(value);
  }, point);
}

async function worldToPage(page: Page, point: Point): Promise<Point> {
  const screen = await page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, point);
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { x: box.x + screen.x, y: box.y + screen.y };
}

async function canvasPoint(page: Page, local: Point): Promise<Point> {
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { x: box.x + local.x, y: box.y + local.y };
}

async function openNewBoard(page: Page): Promise<void> {
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.goto('/');
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
}

async function drag(page: Page, from: Point, to: Point): Promise<void> {
  const start = await canvasPoint(page, from);
  const end = await canvasPoint(page, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

async function drawSelectedArrow(page: Page, from: Point, to: Point): Promise<BoardElement> {
  await page.keyboard.press('a');
  await drag(page, from, to);
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [arrow] = await elements(page);
  if (arrow === undefined || arrow.type !== 'arrow') {
    throw new Error('Expected an arrow');
  }
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection()))
    .toEqual([arrow.id]);
  return arrow;
}

function round(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round(value * 100) / 100;
}

test('[F06-S2-AC1] moves the arrival handle without moving the start', async ({ page }) => {
  await openNewBoard(page);
  const arrow = await drawSelectedArrow(page, { x: 400, y: 250 }, { x: 620, y: 370 });

  const target = await screenToWorld(page, { x: 760, y: 200 });
  const handle = await worldToPage(page, { x: arrow.x2 ?? 0, y: arrow.y2 ?? 0 });
  const destination = await canvasPoint(page, { x: 760, y: 200 });
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      const [moved] = await elements(page);
      return [round(moved?.x1), round(moved?.y1), round(moved?.x2), round(moved?.y2)];
    })
    .toEqual([round(arrow.x1), round(arrow.y1), round(target.x), round(target.y)]);
});

test('[F06-S2-AC2] moves both endpoints by the same vector when the body is dragged', async ({
  page,
}) => {
  await openNewBoard(page);
  const arrow = await drawSelectedArrow(page, { x: 350, y: 250 }, { x: 650, y: 450 });

  const midpoint = {
    x: ((arrow.x1 ?? 0) + (arrow.x2 ?? 0)) / 2,
    y: ((arrow.y1 ?? 0) + (arrow.y2 ?? 0)) / 2,
  };
  const start = await worldToPage(page, midpoint);
  const screenDelta = { x: 120, y: 80 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + screenDelta.x, start.y + screenDelta.y, { steps: 8 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      const [moved] = await elements(page);
      return [round(moved?.x1), round(moved?.y1), round(moved?.x2), round(moved?.y2)];
    })
    .toEqual([
      round((arrow.x1 ?? 0) + screenDelta.x),
      round((arrow.y1 ?? 0) + screenDelta.y),
      round((arrow.x2 ?? 0) + screenDelta.x),
      round((arrow.y2 ?? 0) + screenDelta.y),
    ]);
});
