import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type BoardElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
};

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  getViewport: () => Viewport;
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

async function order(page: Page): Promise<string[]> {
  const list = await elements(page);
  return [...list]
    .sort((a, b) => (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0))
    .map((element) => element.id);
}

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
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

async function openBoard(page: Page, id: string, count: number): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(count);
}

async function seededBoard(request: APIRequestContext, count: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Order ${Date.now()}`, elements: count },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

async function clickWorld(page: Page, point: Point, shift = false): Promise<void> {
  const target = await worldToPage(page, point);
  if (shift) {
    await page.keyboard.down('Shift');
  }
  await page.mouse.click(target.x, target.y);
  if (shift) {
    await page.keyboard.up('Shift');
  }
}

async function selectElement(page: Page, element: BoardElement, shift = false): Promise<void> {
  await clickWorld(page, center(element), shift);
}

test('[F07-S4-AC1] advances an element one step with "]" and the Avancer button', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 3);
  await openBoard(page, board.id, 3);
  const [a, b, c] = [...(await elements(page))].sort((x, y) => (x.zIndex < y.zIndex ? -1 : 1));
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error('Expected three seeded elements');
  }

  await selectElement(page, a);
  await expect.poll(() => selection(page)).toEqual([a.id]);

  await page.getByTestId('order-forward').click();
  await expect.poll(() => order(page)).toEqual([b.id, a.id, c.id]);

  await page.keyboard.press(']');
  await expect.poll(() => order(page)).toEqual([b.id, c.id, a.id]);
});

test('[F07-S4-AC2] sends an element back one step with "[" and the Reculer button', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 3);
  await openBoard(page, board.id, 3);
  const [a, b, c] = [...(await elements(page))].sort((x, y) => (x.zIndex < y.zIndex ? -1 : 1));
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error('Expected three seeded elements');
  }

  await selectElement(page, c);
  await expect.poll(() => selection(page)).toEqual([c.id]);

  await page.keyboard.press('[');
  await expect.poll(() => order(page)).toEqual([a.id, c.id, b.id]);

  await page.getByTestId('order-backward').click();
  await expect.poll(() => order(page)).toEqual([c.id, a.id, b.id]);
});

test('[F07-S4-AC3] disables the buttons at the stacking limits', async ({ page, request }) => {
  const board = await seededBoard(request, 3);
  await openBoard(page, board.id, 3);
  const [a, , c] = [...(await elements(page))].sort((x, y) => (x.zIndex < y.zIndex ? -1 : 1));
  if (a === undefined || c === undefined) {
    throw new Error('Expected three seeded elements');
  }

  await selectElement(page, a);
  await expect(page.getByTestId('order-backward')).toBeDisabled();
  await expect(page.getByTestId('order-forward')).toBeEnabled();

  await selectElement(page, c);
  await expect(page.getByTestId('order-forward')).toBeDisabled();
  await expect(page.getByTestId('order-backward')).toBeEnabled();
});

test('[F07-S4-AC4] moves a multiple selection one step while preserving its order', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 4);
  await openBoard(page, board.id, 4);
  const [a, b, c, d] = [...(await elements(page))].sort((x, y) => (x.zIndex < y.zIndex ? -1 : 1));
  if (a === undefined || b === undefined || c === undefined || d === undefined) {
    throw new Error('Expected four seeded elements');
  }

  await selectElement(page, a);
  await selectElement(page, b, true);
  await selectElement(page, c, true);
  await expect.poll(async () => (await selection(page)).sort()).toEqual([a.id, b.id, c.id].sort());

  await page.getByTestId('order-forward').click();
  await expect.poll(() => order(page)).toEqual([d.id, a.id, b.id, c.id]);
});
