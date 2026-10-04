import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};
type OverlayBox = { x: number; y: number; width: number; height: number };
type OverlayBoxes = { selection: OverlayBox | null; handles: OverlayBox[] };

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  worldToScreen: (point: Point) => Point;
  getOverlayBoxes: () => OverlayBoxes;
};

async function createBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/boards', {
    data: { name: `Layout arrow ${Date.now()}` },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

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

async function overlayBoxes(page: Page): Promise<OverlayBoxes> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getOverlayBoxes();
  });
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

const viewports = [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
];

for (const viewport of viewports) {
  test.describe(`board arrow selection at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('[UI-BOARD-10] shows two round handles and no frame for a selected arrow', async ({
      page,
      request,
    }) => {
      const board = await createBoard(request);
      await page.goto(`/b/${board.id}`);
      await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
      await waitForBoardApi(page);

      const box = await page.getByTestId('board-canvas').boundingBox();
      if (box === null) {
        throw new Error('Expected the canvas to have a bounding box');
      }
      await page.keyboard.press('a');
      await page.mouse.move(box.x + 300, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 500, box.y + 400, { steps: 5 });
      await page.mouse.up();

      await expect.poll(async () => (await elements(page)).length).toBe(1);
      const [arrow] = await elements(page);
      if (arrow === undefined || arrow.type !== 'arrow') {
        throw new Error('Expected an arrow');
      }

      const boxes = await overlayBoxes(page);
      expect(boxes.selection).toBeNull();

      const start = await worldToScreen(page, { x: arrow.x1 ?? 0, y: arrow.y1 ?? 0 });
      const end = await worldToScreen(page, { x: arrow.x2 ?? 0, y: arrow.y2 ?? 0 });
      expect(boxes.handles).toHaveLength(2);
      expect(boxes.handles[0]).toEqual({ x: start.x - 4, y: start.y - 4, width: 8, height: 8 });
      expect(boxes.handles[1]).toEqual({ x: end.x - 4, y: end.y - 4, width: 8, height: 8 });
    });
  });
}
