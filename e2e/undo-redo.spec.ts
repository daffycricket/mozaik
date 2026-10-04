import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
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

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Annuler ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, id: string): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(0);
}

async function createSticky(page: Page): Promise<BoardElement> {
  await page.keyboard.press('n');
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.mouse.click(box.x + 400, box.y + 300);
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [sticky] = await elements(page);
  if (sticky === undefined) {
    throw new Error('Expected the sticky note to be created');
  }
  return sticky;
}

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

function isDisabled(page: Page, testId: string): Promise<boolean> {
  return page.getByTestId(testId).isDisabled();
}

test('[F08-S2-AC1] undoes a move then a creation, then redoes the creation', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  const created = await createSticky(page);

  const start = await worldToPage(page, center(created));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 140, start.y + 90, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await elements(page))[0]?.x).toBeGreaterThan(created.x + 50);

  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => {
      const [moved] = await elements(page);
      return [moved?.x, moved?.y];
    })
    .toEqual([created.x, created.y]);

  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await elements(page)).length).toBe(0);

  await page.keyboard.press('Control+Shift+z');
  await expect
    .poll(async () => {
      const [restored] = await elements(page);
      return [restored?.x, restored?.y];
    })
    .toEqual([created.x, created.y]);
});

test('[F08-S2-AC3] disables the undo and redo buttons without history and toggles them', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  expect(await isDisabled(page, 'undo')).toBe(true);
  expect(await isDisabled(page, 'redo')).toBe(true);

  await createSticky(page);
  expect(await isDisabled(page, 'undo')).toBe(false);
  expect(await isDisabled(page, 'redo')).toBe(true);

  await page.getByTestId('undo').click();
  await expect.poll(async () => (await elements(page)).length).toBe(0);
  expect(await isDisabled(page, 'undo')).toBe(true);
  expect(await isDisabled(page, 'redo')).toBe(false);

  await page.getByTestId('redo').click();
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  expect(await isDisabled(page, 'undo')).toBe(false);
  expect(await isDisabled(page, 'redo')).toBe(true);
});
