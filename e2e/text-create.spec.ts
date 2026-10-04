import { measureTextBox, TEXT_LINE_HEIGHT } from '@mozaik/model';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type TextElement = {
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
  getElements: () => TextElement[];
  worldToScreen: (point: Point) => Point;
};

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Texte ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, boardId: string): Promise<void> {
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

async function elements(page: Page): Promise<TextElement[]> {
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

test('[F05-S1-AC1] creates an empty text at the click point and opens the editor', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  const point = { x: 320, y: 240 };
  await page.keyboard.press('t');
  await clickWorld(page, point);

  await expect(page.getByTestId('text-editor')).toBeVisible();
  await expect.poll(async () => (await elements(page)).length).toBe(1);

  const [text] = await elements(page);
  expect(text?.type).toBe('text');
  expect(Math.abs((text?.x ?? 0) - point.x)).toBeLessThanOrEqual(1);
  expect(Math.abs((text?.y ?? 0) - point.y)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');

  const editor = page.getByTestId('text-editor');
  await editor.fill('Bonjour');
  await page.keyboard.press('Escape');

  await expect(editor).toHaveCount(0);
  await expect.poll(async () => (await elements(page))[0]?.text).toBe('Bonjour');
});

test('[F05-S1-AC2] removes an empty text when leaving the editor', async ({ page, request }) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  await page.keyboard.press('t');
  await clickWorld(page, { x: 300, y: 220 });
  await expect(page.getByTestId('text-editor')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByTestId('text-editor')).toHaveCount(0);
  await expect.poll(async () => (await elements(page)).length).toBe(0);
});

test('[F05-S1-AC3] sizes the text height to its number of lines', async ({ page, request }) => {
  const board = await seededBoard(request);
  await openBoard(page, board.id);

  await page.keyboard.press('t');
  await clickWorld(page, { x: 300, y: 220 });
  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();

  await editor.fill('a');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('b');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('c');
  await page.keyboard.press('Escape');

  await expect.poll(async () => (await elements(page))[0]?.height).toBe(3 * TEXT_LINE_HEIGHT);
  const [text] = await elements(page);
  expect(text?.height).toBe(measureTextBox('a\nb\nc').height);
});
