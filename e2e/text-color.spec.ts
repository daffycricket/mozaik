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
  color: string;
};

type BoardApi = {
  getElements: () => BoardElement[];
  worldToScreen: (point: Point) => Point;
};

const PALETTE_COLORS = [
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
] as const;

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Couleur texte ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, boardId: string, count: number): Promise<void> {
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
  await expect.poll(async () => (await elements(page)).length).toBe(count);
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

async function createText(page: Page, point: Point, value: string): Promise<void> {
  await page.keyboard.press('t');
  await clickWorld(page, point);
  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();
  await editor.fill(value);
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
}

test('[F05-S2-AC1] recolours every selected free text with the chosen colour', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 0);
  await openBoard(page, board.id, 0);

  await createText(page, { x: 320, y: 240 }, 'Titre');
  await page.keyboard.press('Control+a');
  await expect(page.getByTestId('context-bar')).toBeVisible();

  await page.getByTestId('color-red').click();

  await expect.poll(async () => (await elements(page))[0]?.color).toBe('red');
  await expect(page.getByTestId('color-red')).toHaveAttribute('aria-pressed', 'true');
});

test('[F05-S2-AC2] offers the ten palette colours and marks the current one', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 0);
  await openBoard(page, board.id, 0);

  await createText(page, { x: 320, y: 240 }, 'Titre');
  await page.keyboard.press('Control+a');
  await expect(page.getByTestId('context-bar')).toBeVisible();

  for (const color of PALETTE_COLORS) {
    await expect(page.getByTestId(`color-${color}`)).toBeVisible();
  }
  await expect(page.getByTestId('color-black')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('color-red')).toHaveAttribute('aria-pressed', 'false');

  await page.getByTestId('color-red').click();
  await expect(page.getByTestId('color-red')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('color-black')).toHaveAttribute('aria-pressed', 'false');
});

test('[F05-S2-AC3] recolours sticky notes and free texts in a mixed selection', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);

  await createText(page, { x: 420, y: 320 }, 'Titre');
  await page.keyboard.press('Control+a');
  await expect(page.getByTestId('context-bar')).toBeVisible();

  await page.getByTestId('color-green').click();

  await expect
    .poll(async () => (await elements(page)).map((element) => element.color).sort())
    .toEqual(['green', 'green']);
});
