import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
};
type OverlayBox = { x: number; y: number; width: number; height: number };
type OverlayBoxes = { selection: OverlayBox | null; handles: OverlayBox[] };

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
  screenToWorld: (point: Point) => Point;
  getOverlayBoxes: () => OverlayBoxes;
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

async function elementCount(page: Page): Promise<number> {
  return (await elements(page)).length;
}

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
}

async function overlayBoxes(page: Page): Promise<OverlayBoxes> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getOverlayBoxes();
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

async function openBoard(page: Page, id: string, count: number): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(() => elementCount(page)).toBe(count);
}

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Selection ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function clickWorld(page: Page, point: Point, shift = false): Promise<void> {
  const screen = await worldToScreen(page, point);
  const target = await canvasPoint(page, screen);
  if (shift) {
    await page.keyboard.down('Shift');
  }
  await page.mouse.click(target.x, target.y);
  if (shift) {
    await page.keyboard.up('Shift');
  }
}

async function createStickyAt(page: Page, local: Point): Promise<void> {
  const before = await elementCount(page);
  await page.keyboard.press('n');
  const target = await canvasPoint(page, local);
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => elementCount(page)).toBe(before + 1);
}

test('[F07-S1-AC1] selects a single element with a frame and eight handles', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 2);
  await openBoard(page, board.id, 2);
  const [first, second] = await elements(page);
  if (first === undefined || second === undefined) {
    throw new Error('Expected two seeded elements');
  }

  await clickWorld(page, { x: first.x + first.width / 2, y: first.y + first.height / 2 });

  await expect.poll(() => selection(page)).toEqual([first.id]);
  const boxes = await overlayBoxes(page);
  const topLeft = await worldToScreen(page, { x: first.x, y: first.y });
  expect(boxes.selection).toEqual({
    x: topLeft.x,
    y: topLeft.y,
    width: first.width,
    height: first.height,
  });
  expect(boxes.handles).toHaveLength(8);

  await clickWorld(page, { x: second.x + second.width / 2, y: second.y + second.height / 2 });
  await expect.poll(() => selection(page)).toEqual([second.id]);
});

test('[F07-S1-AC2] adds and removes an element from the selection with Shift', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 2);
  await openBoard(page, board.id, 2);
  const [first, second] = await elements(page);
  if (first === undefined || second === undefined) {
    throw new Error('Expected two seeded elements');
  }

  await clickWorld(page, { x: first.x + first.width / 2, y: first.y + first.height / 2 });
  await clickWorld(page, { x: second.x + second.width / 2, y: second.y + second.height / 2 }, true);
  await expect.poll(() => selection(page)).toEqual([first.id, second.id]);

  await clickWorld(page, { x: second.x + second.width / 2, y: second.y + second.height / 2 }, true);
  await expect.poll(() => selection(page)).toEqual([first.id]);
});

test('[F07-S1-AC3] selects the elements fully contained in the dragged rectangle', async ({
  page,
}) => {
  await page.goto('/');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);

  await createStickyAt(page, { x: 200, y: 200 });
  await createStickyAt(page, { x: 600, y: 200 });
  await createStickyAt(page, { x: 200, y: 600 });

  const list = await elements(page);
  const contained = list
    .filter(
      (element) =>
        element.x >= 50 &&
        element.y >= 50 &&
        element.x + element.width <= 750 &&
        element.y + element.height <= 400,
    )
    .map((element) => element.id)
    .sort();
  expect(contained).toHaveLength(2);

  const start = await canvasPoint(page, { x: 50, y: 50 });
  const end = await canvasPoint(page, { x: 750, y: 400 });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();

  await expect.poll(async () => (await selection(page)).sort()).toEqual(contained);
});

test('[F07-S1-AC4] selects everything with Ctrl+A and clears with Escape or an empty click', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 2);
  await openBoard(page, board.id, 2);
  const ids = (await elements(page)).map((element) => element.id).sort();

  await page.keyboard.press('Control+a');
  await expect.poll(async () => (await selection(page)).sort()).toEqual(ids);

  await page.keyboard.press('Escape');
  await expect.poll(() => selection(page)).toEqual([]);

  await page.keyboard.press('Control+a');
  await expect.poll(async () => (await selection(page)).sort()).toEqual(ids);

  const empty = await canvasPoint(page, { x: 900, y: 600 });
  const world = await screenToWorld(page, { x: 900, y: 600 });
  expect(world.x).toBeGreaterThan(300);
  await page.mouse.click(empty.x, empty.y);
  await expect.poll(() => selection(page)).toEqual([]);
});
