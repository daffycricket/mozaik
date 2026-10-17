import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };
type Box = { x: number; y: number; width: number; height: number };

type BoardApi = {
  getElements: () => Box[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
};

const FIT_PADDING = 48;
const EPSILON = 1e-6;

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
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

async function elements(page: Page): Promise<Box[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getElements() ?? []);
}

function unionBounds(boxes: Box[]): Box | null {
  if (boxes.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const box of boxes) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function screenBox(bounds: Box, viewport: Viewport): Box {
  return {
    x: (bounds.x - viewport.x) * viewport.zoom,
    y: (bounds.y - viewport.y) * viewport.zoom,
    width: bounds.width * viewport.zoom,
    height: bounds.height * viewport.zoom,
  };
}

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Recadrage ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, boardId: string): Promise<void> {
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
}

async function canvasSize(page: Page): Promise<{ width: number; height: number }> {
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { width: box.width, height: box.height };
}

async function contentBounds(page: Page): Promise<Box> {
  const bounds = unionBounds(await elements(page));
  if (bounds === null) {
    throw new Error('Expected the board to have content');
  }
  return bounds;
}

async function clickFit(page: Page): Promise<void> {
  await page.getByTestId('zoom-fit').click();
}

test('[F02-S4-AC1] fits content smaller than the viewport', async ({ page, request }) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await page.keyboard.press('Shift+Digit1');
  await expect.poll(() => viewport(page).then((value) => value.zoom)).not.toBe(1);

  const viewportValue = await viewport(page);
  const box = screenBox(await contentBounds(page), viewportValue);
  expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.x + box.width).toBeLessThanOrEqual(canvas.width - FIT_PADDING + EPSILON);
  expect(box.y + box.height).toBeLessThanOrEqual(canvas.height - FIT_PADDING + EPSILON);
  expect(box.x + box.width / 2).toBeCloseTo(canvas.width / 2, 3);
  expect(box.y + box.height / 2).toBeCloseTo(canvas.height / 2, 3);
});

test('[F02-S4-AC1] zooms out so content larger than the viewport is fully visible', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 100);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await page.keyboard.press('Shift+Digit1');
  const viewportValue = await viewport(page);

  expect(viewportValue.zoom).toBeLessThan(1);
  const box = screenBox(await contentBounds(page), viewportValue);
  expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.x + box.width).toBeLessThanOrEqual(canvas.width - FIT_PADDING + EPSILON);
  expect(box.y + box.height).toBeLessThanOrEqual(canvas.height - FIT_PADDING + EPSILON);
  expect(box.x + box.width / 2).toBeCloseTo(canvas.width / 2, 3);
  expect(box.y + box.height / 2).toBeCloseTo(canvas.height / 2, 3);
});

test('[F02-S4-AC2] returns to the default viewport on an empty board', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 0);
  await openBoard(page, board.id);

  await page.keyboard.press('Control+=');
  await expect.poll(() => viewport(page).then((value) => value.zoom)).not.toBe(1);

  await page.keyboard.press('Shift+Digit1');
  await expect.poll(() => viewport(page)).toEqual({ x: 0, y: 0, zoom: 1 });
});

test('[F02-S4-AC3] clamps the fit zoom to the minimum and keeps the content centered', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 600);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await page.keyboard.press('Shift+Digit1');
  const viewportValue = await viewport(page);

  expect(viewportValue.zoom).toBeCloseTo(0.1, 6);
  const bounds = await contentBounds(page);
  const center = {
    x: (bounds.x + bounds.width / 2 - viewportValue.x) * viewportValue.zoom,
    y: (bounds.y + bounds.height / 2 - viewportValue.y) * viewportValue.zoom,
  };
  expect(center.x).toBeCloseTo(canvas.width / 2, 3);
  expect(center.y).toBeCloseTo(canvas.height / 2, 3);
});

test('[F02-S4-AC5] fits content smaller than the viewport from the zoom controls', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await clickFit(page);
  await expect.poll(() => viewport(page).then((value) => value.zoom)).not.toBe(1);

  const viewportValue = await viewport(page);
  const box = screenBox(await contentBounds(page), viewportValue);
  expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.x + box.width).toBeLessThanOrEqual(canvas.width - FIT_PADDING + EPSILON);
  expect(box.y + box.height).toBeLessThanOrEqual(canvas.height - FIT_PADDING + EPSILON);
  expect(box.x + box.width / 2).toBeCloseTo(canvas.width / 2, 3);
  expect(box.y + box.height / 2).toBeCloseTo(canvas.height / 2, 3);
});

test('[F02-S4-AC5] zooms out from the zoom controls on content larger than the viewport', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 100);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await clickFit(page);
  const viewportValue = await viewport(page);

  expect(viewportValue.zoom).toBeLessThan(1);
  const box = screenBox(await contentBounds(page), viewportValue);
  expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
  expect(box.x + box.width).toBeLessThanOrEqual(canvas.width - FIT_PADDING + EPSILON);
  expect(box.y + box.height).toBeLessThanOrEqual(canvas.height - FIT_PADDING + EPSILON);
  expect(box.x + box.width / 2).toBeCloseTo(canvas.width / 2, 3);
  expect(box.y + box.height / 2).toBeCloseTo(canvas.height / 2, 3);
});

test('[F02-S4-AC5] returns to the default viewport from the zoom controls on an empty board', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 0);
  await openBoard(page, board.id);

  await page.keyboard.press('Control+=');
  await expect.poll(() => viewport(page).then((value) => value.zoom)).not.toBe(1);

  await clickFit(page);
  await expect.poll(() => viewport(page)).toEqual({ x: 0, y: 0, zoom: 1 });
});

test('[F02-S4-AC5] clamps the fit zoom to the minimum from the zoom controls', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 600);
  await openBoard(page, board.id);
  const canvas = await canvasSize(page);

  await clickFit(page);
  const viewportValue = await viewport(page);

  expect(viewportValue.zoom).toBeCloseTo(0.1, 6);
  const bounds = await contentBounds(page);
  const center = {
    x: (bounds.x + bounds.width / 2 - viewportValue.x) * viewportValue.zoom,
    y: (bounds.y + bounds.height / 2 - viewportValue.y) * viewportValue.zoom,
  };
  expect(center.x).toBeCloseTo(canvas.width / 2, 3);
  expect(center.y).toBeCloseTo(canvas.height / 2, 3);
});
