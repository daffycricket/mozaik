import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Viewport = { x: number; y: number; zoom: number };
type ScreenPoint = { x: number; y: number };

type BoardApi = {
  getViewport: () => Viewport;
  worldToScreen: (point: ScreenPoint) => ScreenPoint;
  screenToWorld: (point: ScreenPoint) => ScreenPoint;
};

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

async function worldToScreen(page: Page, point: ScreenPoint): Promise<ScreenPoint> {
  return page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, point);
}

async function screenToWorld(page: Page, point: ScreenPoint): Promise<ScreenPoint> {
  return page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.screenToWorld(value);
  }, point);
}

async function openNewBoard(page: Page): Promise<void> {
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.goto('/');
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
}

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Zoom ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

test('[F02-S2-AC1] zooms centered on the pointer with Ctrl+wheel', async ({ page, request }) => {
  const board = await seededBoard(request, 1);
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);

  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  const pagePoint = { x: box.x + 400, y: box.y + 300 };
  const local = { x: 400, y: 300 };
  const world = await screenToWorld(page, local);
  const before = await viewport(page);

  await page.mouse.move(pagePoint.x, pagePoint.y);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -120);
  await page.keyboard.up('Control');

  await expect.poll(() => viewport(page).then((value) => value.zoom)).toBeGreaterThan(before.zoom);

  const anchored = await worldToScreen(page, world);
  expect(Math.abs(anchored.x - local.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(anchored.y - local.y)).toBeLessThanOrEqual(1);
});

test('[F02-S2-AC2] clamps the zoom between 10 % and 400 %', async ({ page }) => {
  await openNewBoard(page);

  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Control+=');
  }
  await expect
    .poll(() => viewport(page).then((value) => Math.round(value.zoom * 1000) / 1000))
    .toBe(4);

  for (let step = 0; step < 25; step += 1) {
    await page.keyboard.press('Control+-');
  }
  await expect
    .poll(() => viewport(page).then((value) => Math.round(value.zoom * 1000) / 1000))
    .toBe(0.1);
});

test('[F02-S2-AC3] changes the zoom with the controls and shortcuts', async ({ page }) => {
  await openNewBoard(page);
  const level = page.getByTestId('zoom-level');

  await expect(level).toHaveText('100 %');

  await page.getByTestId('zoom-in').click();
  await expect(level).toHaveText('120 %');

  await page.getByTestId('zoom-out').click();
  await expect(level).toHaveText('100 %');

  await page.keyboard.press('Control+=');
  await expect(level).toHaveText('120 %');

  await page.keyboard.press('Control+-');
  await expect(level).toHaveText('100 %');

  await page.keyboard.press('Control+=');
  await expect(level).toHaveText('120 %');
  await page.keyboard.press('Control+0');
  await expect(level).toHaveText('100 %');
});
