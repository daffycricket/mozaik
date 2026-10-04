import { fitStickyFontSize } from '@mozaik/model';
import { type APIRequestContext, expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type StickyElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type BoardApi = {
  getElements: () => StickyElement[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
};

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `UI-BOARD-9 ${Date.now()}`, elements: 1 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

test('[UI-BOARD-9] overlays the text editor on the element at the rendered font size', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request);
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
      ),
    )
    .toBe(1);

  const [sticky] = await page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements() ?? [],
  );
  if (sticky === undefined) {
    throw new Error('Expected a seeded sticky note');
  }

  const canvas = page.getByTestId('board-canvas');
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }

  const screen = await page.evaluate(
    (point) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      if (api === undefined) {
        throw new Error('board API not exposed');
      }
      return api.worldToScreen(point);
    },
    { x: sticky.x + sticky.width / 2, y: sticky.y + sticky.height / 2 },
  );
  await page.mouse.dblclick(box.x + screen.x, box.y + screen.y);

  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();

  const viewport = await page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getViewport();
  });
  const editorBox = await editor.boundingBox();
  if (editorBox === null) {
    throw new Error('Expected the text editor to have a bounding box');
  }

  expect(Math.abs(editorBox.x - (box.x + sticky.x * viewport.zoom))).toBeLessThanOrEqual(2);
  expect(Math.abs(editorBox.y - (box.y + sticky.y * viewport.zoom))).toBeLessThanOrEqual(2);
  expect(Math.abs(editorBox.width - sticky.width * viewport.zoom)).toBeLessThanOrEqual(2);
  expect(Math.abs(editorBox.height - sticky.height * viewport.zoom)).toBeLessThanOrEqual(2);

  const expectedFontSize =
    fitStickyFontSize(sticky.text, { width: sticky.width, height: sticky.height }) * viewport.zoom;
  const actualFontSize = await editor.evaluate((element) => {
    const browser = globalThis as unknown as {
      getComputedStyle: (target: unknown) => { fontSize: string };
    };
    return Number.parseFloat(browser.getComputedStyle(element).fontSize);
  });
  expect(Math.abs(actualFontSize - expectedFontSize)).toBeLessThanOrEqual(0.5);
});
