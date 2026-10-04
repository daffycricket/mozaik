import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type BoardElement = { id: string; x: number; y: number; width: number; height: number };
type OverlayBox = { x: number; y: number; width: number; height: number };
type OverlayBoxes = { selection: OverlayBox | null; handles: OverlayBox[] };

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  worldToScreen: (point: Point) => Point;
  getOverlayBoxes: () => OverlayBoxes;
};

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Layout selection ${Date.now()}`, elements },
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

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getSelection();
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
  test.describe(`board selection at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('[UI-BOARD-10] frames the selected element with eight square handles', async ({
      page,
      request,
    }) => {
      const board = await seededBoard(request, 1);
      await page.goto(`/b/${board.id}`);
      await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
      await waitForBoardApi(page);
      await expect.poll(async () => (await elements(page)).length).toBe(1);

      const [element] = await elements(page);
      if (element === undefined) {
        throw new Error('Expected a seeded element');
      }
      const screen = await worldToScreen(page, {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      });
      const canvas = await page.getByTestId('board-canvas').boundingBox();
      if (canvas === null) {
        throw new Error('Expected the canvas to have a bounding box');
      }
      await page.mouse.click(canvas.x + screen.x, canvas.y + screen.y);

      await expect.poll(() => selection(page)).toEqual([element.id]);

      const boxes = await overlayBoxes(page);
      if (boxes.selection === null) {
        throw new Error('Expected a selection frame');
      }
      const topLeft = await worldToScreen(page, { x: element.x, y: element.y });
      expect(boxes.selection).toEqual({
        x: topLeft.x,
        y: topLeft.y,
        width: element.width,
        height: element.height,
      });

      const centerXs = [
        boxes.selection.x,
        boxes.selection.x + boxes.selection.width / 2,
        boxes.selection.x + boxes.selection.width,
      ];
      const centerYs = [
        boxes.selection.y,
        boxes.selection.y + boxes.selection.height / 2,
        boxes.selection.y + boxes.selection.height,
      ];
      expect(boxes.handles).toHaveLength(8);
      for (const handle of boxes.handles) {
        expect(handle.width).toBe(8);
        expect(handle.height).toBe(8);
      }
      for (const [row, y] of centerYs.entries()) {
        for (const [column, x] of centerXs.entries()) {
          if (row === 1 && column === 1) {
            continue;
          }
          const found = boxes.handles.some(
            (handle) =>
              Math.abs(handle.x + handle.width / 2 - x) < 0.01 &&
              Math.abs(handle.y + handle.height / 2 - y) < 0.01,
          );
          expect(found, `expected a handle centered at (${x}, ${y})`).toBe(true);
        }
      }
    });
  });
}
