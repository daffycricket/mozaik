import { expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  screenToWorld: (point: Point) => Point;
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

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
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

async function click(page: Page, local: Point): Promise<void> {
  const point = await canvasPoint(page, local);
  await page.mouse.click(point.x, point.y);
}

async function drag(page: Page, from: Point, to: Point): Promise<void> {
  const start = await canvasPoint(page, from);
  const end = await canvasPoint(page, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

test('[F06-S1-AC1] draws a selected arrow from A to B and returns to the selection tool', async ({
  page,
}) => {
  await openNewBoard(page);
  const from = { x: 400, y: 250 };
  const to = { x: 620, y: 370 };
  const fromWorld = await screenToWorld(page, from);
  const toWorld = await screenToWorld(page, to);

  await page.keyboard.press('a');
  await expect(page.getByTestId('tool-arrow')).toHaveAttribute('aria-pressed', 'true');

  await drag(page, from, to);

  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [arrow] = await elements(page);
  if (arrow === undefined) {
    throw new Error('Expected an arrow');
  }

  expect(arrow.type).toBe('arrow');
  expect(arrow.x1).toBeCloseTo(fromWorld.x, 3);
  expect(arrow.y1).toBeCloseTo(fromWorld.y, 3);
  expect(arrow.x2).toBeCloseTo(toWorld.x, 3);
  expect(arrow.y2).toBeCloseTo(toWorld.y, 3);
  expect(await selection(page)).toEqual([arrow.id]);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
});

test('[F06-S1-AC2] creates nothing when the drag is shorter than the minimum length', async ({
  page,
}) => {
  await openNewBoard(page);

  await page.keyboard.press('a');
  await drag(page, { x: 500, y: 300 }, { x: 506, y: 300 });

  await expect.poll(async () => (await elements(page)).length).toBe(0);
});

test('[F06-S1-AC3] leaves the arrow in place when a sticky note moves', async ({ page }) => {
  await openNewBoard(page);

  await page.keyboard.press('n');
  await click(page, { x: 400, y: 400 });
  await page.keyboard.press('n');
  await click(page, { x: 800, y: 400 });

  await page.keyboard.press('a');
  await drag(page, { x: 400, y: 200 }, { x: 800, y: 200 });
  await expect.poll(async () => (await elements(page)).length).toBe(3);

  const before = await elements(page);
  const arrow = before.find((element) => element.type === 'arrow');
  const sticky = before.find((element) => element.type === 'sticky' && element.x < 500);
  if (arrow === undefined || sticky === undefined) {
    throw new Error('Expected an arrow and a sticky note');
  }

  await click(page, { x: 400, y: 400 });
  await expect.poll(() => selection(page)).toEqual([sticky.id]);

  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => (await elements(page)).find((element) => element.id === sticky.id)?.x ?? 0)
    .toBeGreaterThan(sticky.x);

  const after = await elements(page);
  expect(after.find((element) => element.id === arrow.id)).toEqual(arrow);
});
