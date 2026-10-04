import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
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

async function seededBoard(request: APIRequestContext, count: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Couleur ${Date.now()}`, elements: count },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, id: string, count: number): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(count);
}

async function clickWorld(page: Page, point: Point): Promise<void> {
  const screen = await page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, point);
  const canvas = await page.getByTestId('board-canvas').boundingBox();
  if (canvas === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.mouse.click(canvas.x + screen.x, canvas.y + screen.y);
}

test('[F03-S3-AC1] recolours every selected sticky note with the chosen colour', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 2);
  await openBoard(page, board.id, 2);
  const [first, second] = await elements(page);
  if (first === undefined || second === undefined) {
    throw new Error('Expected two seeded sticky notes');
  }

  await page.keyboard.press('Control+a');
  await expect(page.getByTestId('context-bar')).toBeVisible();

  await page.getByTestId('color-blue').click();

  await expect
    .poll(async () => (await elements(page)).map((element) => element.color))
    .toEqual(['blue', 'blue']);
});

test('[F03-S3-AC2] offers the ten palette colours and marks the current one', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [sticky] = await elements(page);
  if (sticky === undefined) {
    throw new Error('Expected a seeded sticky note');
  }

  await clickWorld(page, { x: sticky.x + sticky.width / 2, y: sticky.y + sticky.height / 2 });
  await expect(page.getByTestId('context-bar')).toBeVisible();

  for (const color of [
    'yellow',
    'orange',
    'red',
    'pink',
    'purple',
    'blue',
    'teal',
    'green',
    'gray',
    'black',
  ]) {
    await expect(page.getByTestId(`color-${color}`)).toBeVisible();
  }
  await expect(page.getByTestId('color-yellow')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('color-blue')).toHaveAttribute('aria-pressed', 'false');

  await page.getByTestId('color-blue').click();
  await expect(page.getByTestId('color-blue')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('color-yellow')).toHaveAttribute('aria-pressed', 'false');
});
