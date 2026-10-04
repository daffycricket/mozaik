import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type StickyElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
  color: string;
  text: string;
};

type BoardApi = {
  getElements: () => StickyElement[];
  getSelection: () => string[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
  screenToWorld: (point: Point) => Point;
};

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

async function elementCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

async function elements(page: Page): Promise<StickyElement[]> {
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

async function worldToScreen(page: Page, point: Point): Promise<Point> {
  return page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
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

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Post-it ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

test('[F03-S1-AC1] creates a selected 200x200 yellow sticky with the sticky tool', async ({
  page,
}) => {
  await openNewBoard(page);
  const local = { x: 400, y: 300 };
  const world = await screenToWorld(page, local);

  await page.keyboard.press('n');
  await expect(page.getByTestId('tool-sticky')).toHaveAttribute('aria-pressed', 'true');

  const point = await canvasPoint(page, local);
  await page.mouse.click(point.x, point.y);

  await expect.poll(() => elementCount(page)).toBe(1);

  const [sticky] = await elements(page);
  const selection = await page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? [],
  );
  if (sticky === undefined) {
    throw new Error('Expected a sticky note');
  }

  expect(sticky.type).toBe('sticky');
  expect(sticky.color).toBe('yellow');
  expect(sticky.width).toBe(200);
  expect(sticky.height).toBe(200);
  expect(sticky.x).toBeCloseTo(world.x - 100, 3);
  expect(sticky.y).toBeCloseTo(world.y - 100, 3);
  expect(selection).toEqual([sticky.id]);

  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
});

test('[F03-S1-AC2] creates a sticky note and enters text editing on a double-click', async ({
  page,
}) => {
  await openNewBoard(page);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');

  const point = await canvasPoint(page, { x: 420, y: 320 });
  await page.mouse.dblclick(point.x, point.y);

  await expect.poll(() => elementCount(page)).toBe(1);
  await expect(page.getByTestId('text-editor')).toBeVisible();
});

test('[F03-S1-AC3] stacks a new sticky note above the existing elements', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(() => elementCount(page)).toBe(1);

  const [existing] = await elements(page);
  if (existing === undefined) {
    throw new Error('Expected a seeded sticky note');
  }
  const screen = await worldToScreen(page, {
    x: existing.x + existing.width / 2,
    y: existing.y + existing.height / 2,
  });
  const point = await canvasPoint(page, screen);

  await page.keyboard.press('n');
  await page.mouse.click(point.x, point.y);

  await expect.poll(() => elementCount(page)).toBe(2);

  const created = (await elements(page)).find((element) => element.id !== existing.id);
  if (created === undefined) {
    throw new Error('Expected a created sticky note');
  }
  expect(created.zIndex > existing.zIndex).toBe(true);
});
