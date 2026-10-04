import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };
type BoardElement = { id: string; x: number; y: number; width: number; height: number };
type OverlayBoxes = { selection: Box | null };

type BoardApi = {
  getElements: () => BoardElement[];
  worldToScreen: (point: Point) => Point;
  getOverlayBoxes: () => OverlayBoxes;
};

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Layout context bar ${Date.now()}`, elements },
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

async function selectElement(page: Page, element: BoardElement): Promise<void> {
  await clickWorld(page, {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  });
  await expect(page.getByTestId('context-bar')).toBeVisible();
}

async function selectionPageBox(page: Page): Promise<Box> {
  const overlay = await page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getOverlayBoxes();
  });
  const canvas = await page.getByTestId('board-canvas').boundingBox();
  if (canvas === null || overlay.selection === null) {
    throw new Error('Expected a selection frame');
  }
  return {
    x: canvas.x + overlay.selection.x,
    y: canvas.y + overlay.selection.y,
    width: overlay.selection.width,
    height: overlay.selection.height,
  };
}

async function contextBarBox(page: Page): Promise<Box> {
  const bar = await page.getByTestId('context-bar').boundingBox();
  if (bar === null) {
    throw new Error('Expected the context bar to have a bounding box');
  }
  return bar;
}

const viewports = [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
];

for (const viewport of viewports) {
  test.describe(`board context bar at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('[UI-BOARD-7] centers the context bar eight pixels above the selection', async ({
      page,
      request,
    }) => {
      const board = await seededBoard(request, 30);
      await openBoard(page, board.id, 30);
      const element = (await elements(page))[22];
      if (element === undefined) {
        throw new Error('Expected a seeded element');
      }

      await selectElement(page, element);
      const selection = await selectionPageBox(page);
      const bar = await contextBarBox(page);

      expect(
        Math.abs(bar.x + bar.width / 2 - (selection.x + selection.width / 2)),
        'horizontal centering over the selection',
      ).toBeLessThanOrEqual(4);
      expect(
        Math.abs(selection.y - (bar.y + bar.height) - 8),
        'eight pixel gap above the selection',
      ).toBeLessThanOrEqual(4);
      expect(bar.y + bar.height, 'never covers the selection').toBeLessThanOrEqual(selection.y + 4);
    });

    test('[UI-BOARD-7] drops the context bar below a selection with no room above', async ({
      page,
      request,
    }) => {
      const board = await seededBoard(request, 30);
      await openBoard(page, board.id, 30);
      const element = (await elements(page))[0];
      if (element === undefined) {
        throw new Error('Expected a seeded element');
      }

      await selectElement(page, element);
      const selection = await selectionPageBox(page);
      const bar = await contextBarBox(page);

      expect(
        Math.abs(bar.x + bar.width / 2 - (selection.x + selection.width / 2)),
        'horizontal centering over the selection',
      ).toBeLessThanOrEqual(4);
      expect(
        Math.abs(bar.y - (selection.y + selection.height) - 8),
        'eight pixel gap below the selection',
      ).toBeLessThanOrEqual(4);
      expect(bar.y, 'never covers the selection').toBeGreaterThanOrEqual(
        selection.y + selection.height - 4,
      );
    });
  });
}
