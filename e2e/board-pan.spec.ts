import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Viewport = { x: number; y: number; zoom: number };
type ScreenPoint = { x: number; y: number };

type BoardApi = {
  getElements: () => unknown[];
  getViewport: () => Viewport;
  worldToScreen: (point: { x: number; y: number }) => ScreenPoint;
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
    data: { name: `Pan ${Date.now()}`, elements },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

test('[F02-S1-AC1] pans the viewport on a plain wheel scroll', async ({ page, request }) => {
  const board = await seededBoard(request, 1);
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
      ),
    )
    .toBe(1);

  const before = await viewport(page);
  const pointBefore = await worldToScreen(page, { x: 0, y: 0 });

  await page.mouse.move(500, 400);
  await page.mouse.wheel(0, 120);

  await expect.poll(() => viewport(page).then((value) => value.y)).toBeCloseTo(before.y + 120, 0);
  const after = await viewport(page);
  expect(after.x).toBeCloseTo(before.x, 0);

  const pointAfter = await worldToScreen(page, { x: 0, y: 0 });
  expect(pointAfter.y).toBeCloseTo(pointBefore.y - 120, 0);
  expect(pointAfter.x).toBeCloseTo(pointBefore.x, 0);
});

test('[F02-S1-AC2] pans with the hand tool while dragging', async ({ page }) => {
  await openNewBoard(page);

  await page.keyboard.press('h');
  await expect(page.getByTestId('tool-hand')).toHaveAttribute('aria-pressed', 'true');

  const before = await viewport(page);
  await page.mouse.move(500, 400);
  await page.mouse.down();
  await page.mouse.move(620, 470, { steps: 6 });
  await page.mouse.up();

  const after = await viewport(page);
  expect(after.x).toBeCloseTo(before.x - 120, 0);
  expect(after.y).toBeCloseTo(before.y - 70, 0);
});

test('[F02-S1-AC3] pans with the space bar whatever the tool and restores it', async ({ page }) => {
  await openNewBoard(page);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');

  const before = await viewport(page);
  await page.keyboard.down('Space');
  await page.mouse.move(500, 400);
  await page.mouse.down();
  await page.mouse.move(600, 450, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up('Space');

  const after = await viewport(page);
  expect(after.x).toBeCloseTo(before.x - 100, 0);
  expect(after.y).toBeCloseTo(before.y - 50, 0);
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
});
