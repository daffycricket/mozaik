import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type StickyElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type BoardApi = {
  getElements: () => StickyElement[];
  worldToScreen: (point: Point) => Point;
};

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
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

async function elementCount(page: Page): Promise<number> {
  return (await elements(page)).length;
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

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Édition post-it ${Date.now()}`, elements: 1 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, boardId: string): Promise<void> {
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(() => elementCount(page)).toBe(1);
}

async function doubleClickSticky(page: Page): Promise<void> {
  const [sticky] = await elements(page);
  if (sticky === undefined) {
    throw new Error('Expected a sticky note');
  }
  const screen = await worldToScreen(page, {
    x: sticky.x + sticky.width / 2,
    y: sticky.y + sticky.height / 2,
  });
  const point = await canvasPoint(page, screen);
  await page.mouse.dblclick(point.x, point.y);
}

test('[F03-S2-AC1] opens the text editor with the existing text on a double-click', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  await doubleClickSticky(page);

  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue('#1');
});

test('[F03-S2-AC1] opens the text editor on Enter when a single sticky is selected', async ({
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

  const point = await canvasPoint(page, { x: 400, y: 300 });
  await page.keyboard.press('n');
  await page.mouse.click(point.x, point.y);
  await expect.poll(() => elementCount(page)).toBe(1);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Enter');

  await expect(page.getByTestId('text-editor')).toBeVisible();
});

test('[F03-S2-AC2] commits the typed text on Escape', async ({ page, request }) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);
  await doubleClickSticky(page);

  const editor = page.getByTestId('text-editor');
  await editor.fill('Idée 1');
  await page.keyboard.press('Escape');

  await expect(editor).toHaveCount(0);
  await expect.poll(async () => (await elements(page))[0]?.text).toBe('Idée 1');
});

test('[F03-S2-AC2] commits the typed text on a click outside', async ({ page, request }) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);
  await doubleClickSticky(page);

  const editor = page.getByTestId('text-editor');
  await editor.fill('Idée 2');
  const outside = await canvasPoint(page, { x: 600, y: 500 });
  await page.mouse.click(outside.x, outside.y);

  await expect(editor).toHaveCount(0);
  await expect.poll(async () => (await elements(page))[0]?.text).toBe('Idée 2');
});

test('[F03-S2-AC3] inserts a line break on Shift+Enter', async ({ page, request }) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);
  await doubleClickSticky(page);

  const editor = page.getByTestId('text-editor');
  await editor.fill('a');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('b');
  await page.keyboard.press('Escape');

  await expect.poll(async () => (await elements(page))[0]?.text).toBe('a\nb');
});
