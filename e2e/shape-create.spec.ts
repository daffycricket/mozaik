import { expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type ShapeElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
};

type BoardApi = {
  getElements: () => ShapeElement[];
  getSelection: () => string[];
  screenToWorld: (point: Point) => Point;
};

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

async function elements(page: Page): Promise<ShapeElement[]> {
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

async function drag(page: Page, from: Point, to: Point): Promise<void> {
  const start = await canvasPoint(page, from);
  const end = await canvasPoint(page, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

test('[F04-S1-AC1] draws a selected rectangle between the two dragged corners', async ({
  page,
}) => {
  await openNewBoard(page);
  const from = { x: 400, y: 250 };
  const to = { x: 620, y: 370 };
  const fromWorld = await screenToWorld(page, from);
  const toWorld = await screenToWorld(page, to);

  await page.keyboard.press('r');
  await expect(page.getByTestId('tool-rect')).toHaveAttribute('aria-pressed', 'true');

  await drag(page, from, to);

  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [shape] = await elements(page);
  if (shape === undefined) {
    throw new Error('Expected a rectangle');
  }

  expect(shape.type).toBe('rect');
  expect(shape.x).toBeCloseTo(Math.min(fromWorld.x, toWorld.x), 3);
  expect(shape.y).toBeCloseTo(Math.min(fromWorld.y, toWorld.y), 3);
  expect(shape.width).toBeCloseTo(Math.abs(toWorld.x - fromWorld.x), 3);
  expect(shape.height).toBeCloseTo(Math.abs(toWorld.y - fromWorld.y), 3);
  expect(await selection(page)).toEqual([shape.id]);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
});

test('[F04-S1-AC2] draws a positive rectangle when dragging right to left and bottom to top', async ({
  page,
}) => {
  await openNewBoard(page);
  const from = { x: 640, y: 420 };
  const to = { x: 420, y: 300 };
  const fromWorld = await screenToWorld(page, from);
  const toWorld = await screenToWorld(page, to);

  await page.keyboard.press('r');
  await drag(page, from, to);

  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [shape] = await elements(page);
  if (shape === undefined) {
    throw new Error('Expected a rectangle');
  }

  expect(shape.width).toBeGreaterThan(0);
  expect(shape.height).toBeGreaterThan(0);
  expect(shape.x).toBeCloseTo(Math.min(fromWorld.x, toWorld.x), 3);
  expect(shape.y).toBeCloseTo(Math.min(fromWorld.y, toWorld.y), 3);
  expect(shape.x + shape.width).toBeCloseTo(Math.max(fromWorld.x, toWorld.x), 3);
  expect(shape.y + shape.height).toBeCloseTo(Math.max(fromWorld.y, toWorld.y), 3);
});

test('[F04-S1-AC3] creates a default sized shape centered on a simple click', async ({ page }) => {
  await openNewBoard(page);
  const local = { x: 500, y: 320 };
  const world = await screenToWorld(page, local);

  await page.keyboard.press('r');
  const point = await canvasPoint(page, local);
  await page.mouse.click(point.x, point.y);

  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [shape] = await elements(page);
  if (shape === undefined) {
    throw new Error('Expected a rectangle');
  }

  expect(shape.width).toBe(160);
  expect(shape.height).toBe(100);
  expect(shape.x).toBeCloseTo(world.x - 80, 3);
  expect(shape.y).toBeCloseTo(world.y - 50, 3);
});

test('[F04-S1-AC4] draws a circle with the ellipse tool while holding Shift', async ({ page }) => {
  await openNewBoard(page);
  const from = { x: 380, y: 260 };
  const to = { x: 620, y: 360 };

  await page.keyboard.press('o');
  await expect(page.getByTestId('tool-ellipse')).toHaveAttribute('aria-pressed', 'true');

  const start = await canvasPoint(page, from);
  const end = await canvasPoint(page, to);
  await page.keyboard.down('Shift');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up('Shift');

  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [shape] = await elements(page);
  if (shape === undefined) {
    throw new Error('Expected an ellipse');
  }

  expect(shape.type).toBe('ellipse');
  expect(shape.width).toBeCloseTo(shape.height, 3);
});
