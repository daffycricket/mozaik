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
    data: { name: `Move ${Date.now()}`, elements: count },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

test('[F07-S2-AC1] moves every selected element by the screen delta divided by the zoom', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 2);
  await openBoard(page, board.id, 2);
  const [first, second] = await elements(page);
  if (first === undefined || second === undefined) {
    throw new Error('Expected two seeded elements');
  }

  const firstCenter = await worldToPage(page, center(first));
  await page.mouse.click(firstCenter.x, firstCenter.y);
  const secondCenter = await worldToPage(page, center(second));
  await page.keyboard.down('Shift');
  await page.mouse.click(secondCenter.x, secondCenter.y);
  await page.keyboard.up('Shift');
  await expect.poll(async () => (await selection(page)).length).toBe(2);

  await page.keyboard.press('Control+-');
  await expect.poll(async () => (await viewport(page)).zoom).toBeLessThan(1);
  const zoom = (await viewport(page)).zoom;

  const start = await worldToPage(page, center(first));
  const screenDelta = { x: 120, y: 80 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + screenDelta.x, start.y + screenDelta.y, { steps: 8 });
  await page.mouse.up();

  const worldDelta = { x: screenDelta.x / zoom, y: screenDelta.y / zoom };
  const round = (value: number): number => Math.round(value * 100) / 100;
  await expect
    .poll(async () => {
      const [movedFirst, movedSecond] = await elements(page);
      return [movedFirst?.x, movedFirst?.y, movedSecond?.x, movedSecond?.y].map((value) =>
        value === undefined ? value : round(value),
      );
    })
    .toEqual([
      round(first.x + worldDelta.x),
      round(first.y + worldDelta.y),
      round(second.x + worldDelta.x),
      round(second.y + worldDelta.y),
    ]);
});

test('[F07-S2-AC2] moves the selection by one or ten world units with the arrow keys', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [element] = await elements(page);
  if (element === undefined) {
    throw new Error('Expected a seeded element');
  }

  const target = await worldToPage(page, center(element));
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => selection(page)).toEqual([element.id]);

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await elements(page))[0]?.x).toBe(element.x + 1);

  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(async () => (await elements(page))[0]?.y).toBe(element.y + 10);
});

test('[F07-S2-AC3] restores the start position with a single undo after a long drag', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, 1);
  await openBoard(page, board.id, 1);
  const [element] = await elements(page);
  if (element === undefined) {
    throw new Error('Expected a seeded element');
  }

  const target = await worldToPage(page, center(element));
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => selection(page)).toEqual([element.id]);

  const start = await worldToPage(page, center(element));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= 20; step += 1) {
    await page.mouse.move(start.x + step * 12, start.y + step * 6);
    await page.waitForTimeout(30);
  }
  await page.mouse.up();

  await expect.poll(async () => (await elements(page))[0]?.x).toBeGreaterThan(element.x + 100);

  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => {
      const [moved] = await elements(page);
      return [moved?.x, moved?.y];
    })
    .toEqual([element.x, element.y]);
});
