import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
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
    data: { name: `Suppression ${Date.now()}`, elements: count },
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

async function selectThree(page: Page): Promise<BoardElement[]> {
  const [a, b, c] = await elements(page);
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error('Expected three seeded elements');
  }
  await clickWorld(page, center(a));
  await clickWorld(page, center(b), true);
  await clickWorld(page, center(c), true);
  await expect.poll(async () => (await selection(page)).length).toBe(3);
  return [a, b, c];
}

test('[F08-S1-AC1] deletes the three selected elements with the Delete key', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 3);
  await openBoard(page, board.id, 3);

  await selectThree(page);
  await page.keyboard.press('Delete');

  await expect.poll(async () => (await elements(page)).length).toBe(0);
  await expect.poll(() => selection(page)).toEqual([]);
});

test('[F08-S1-AC1] deletes the three selected elements with the Backspace key', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 3);
  await openBoard(page, board.id, 3);

  await selectThree(page);
  await page.keyboard.press('Backspace');

  await expect.poll(async () => (await elements(page)).length).toBe(0);
});

test('[F08-S1-AC2] erases a character with Backspace while editing instead of deleting the element', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);

  const [sticky] = await elements(page);
  if (sticky === undefined) {
    throw new Error('Expected a sticky note');
  }
  const point = await worldToPage(page, center(sticky));
  await page.mouse.dblclick(point.x, point.y);

  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();
  await editor.fill('abc');
  await page.keyboard.press('Backspace');

  await expect(editor).toHaveValue('ab');
  expect((await elements(page)).length).toBe(1);

  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
  await expect.poll(async () => (await elements(page))[0]?.text).toBe('ab');
});
