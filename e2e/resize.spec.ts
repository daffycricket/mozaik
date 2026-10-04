import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type BoardElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  getViewport: () => Viewport;
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

async function viewport(page: Page): Promise<Viewport> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getViewport();
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

async function openBoard(page: Page, id: string, count: number): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(count);
}

async function seededBoard(request: APIRequestContext, count: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Resize ${Date.now()}`, elements: count },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

function bottomRight(element: BoardElement): Point {
  return { x: element.x + element.width, y: element.y + element.height };
}

async function selectOnly(page: Page, element: BoardElement): Promise<void> {
  const target = await worldToPage(page, center(element));
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => selection(page)).toEqual([element.id]);
}

async function dragHandle(
  page: Page,
  element: BoardElement,
  delta: Point,
  options: { shift?: boolean } = {},
): Promise<void> {
  const handle = await worldToPage(page, bottomRight(element));
  if (options.shift === true) {
    await page.keyboard.down('Shift');
  }
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + delta.x, handle.y + delta.y, { steps: 8 });
  await page.mouse.up();
  if (options.shift === true) {
    await page.keyboard.up('Shift');
  }
}

test('[F07-S3-AC1] resizes from the bottom-right handle while keeping the top-left corner fixed', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [element] = await elements(page);
  if (element === undefined) {
    throw new Error('Expected a seeded element');
  }

  await selectOnly(page, element);

  const zoom = (await viewport(page)).zoom;
  const screenDelta = { x: 100, y: 60 };
  await dragHandle(page, element, screenDelta);

  const worldDelta = { x: screenDelta.x / zoom, y: screenDelta.y / zoom };
  const round = (value: number): number => Math.round(value * 100) / 100;
  await expect
    .poll(async () => {
      const [resized] = await elements(page);
      return [
        round(resized?.x ?? 0),
        round(resized?.y ?? 0),
        round(resized?.width ?? 0),
        round(resized?.height ?? 0),
      ];
    })
    .toEqual([
      round(element.x),
      round(element.y),
      round(element.width + worldDelta.x),
      round(element.height + worldDelta.y),
    ]);
});

test('[F07-S3-AC2] keeps the width/height ratio while resizing with Shift', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [element] = await elements(page);
  if (element === undefined) {
    throw new Error('Expected a seeded element');
  }

  await selectOnly(page, element);
  await dragHandle(page, element, { x: 100, y: 50 });

  const [stretched] = await elements(page);
  if (stretched === undefined) {
    throw new Error('Expected a resized element');
  }
  expect(stretched.width).toBeGreaterThan(element.width);
  expect(stretched.width).not.toBeCloseTo(stretched.height, 5);

  await dragHandle(page, stretched, { x: 100, y: 0 }, { shift: true });

  const [resized] = await elements(page);
  if (resized === undefined) {
    throw new Error('Expected a resized element');
  }
  expect(resized.width).toBeGreaterThan(stretched.width);
  expect(resized.width / resized.height).toBeCloseTo(stretched.width / stretched.height, 2);
});

test('[F07-S3-AC3] clamps the size to the minimum when reduced below it', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [element] = await elements(page);
  if (element === undefined) {
    throw new Error('Expected a seeded element');
  }

  await selectOnly(page, element);
  await dragHandle(page, element, { x: -500, y: -500 });

  await expect
    .poll(async () => {
      const [resized] = await elements(page);
      return [resized?.width, resized?.height, resized?.x, resized?.y];
    })
    .toEqual([40, 40, element.x, element.y]);
});
