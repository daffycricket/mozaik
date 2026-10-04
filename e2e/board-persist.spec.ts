import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type BoardApi = { getElements: () => Array<{ id: string; text: string }> };

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

function elements(page: Page): Promise<Array<{ id: string; text: string }>> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    return api?.getElements() ?? [];
  });
}

async function seededBoard(request: APIRequestContext): Promise<{ id: string; updatedAt: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Persistance ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; updatedAt: string };
}

test('[F09-S2-AC1] restores the elements after a page reload', async ({ page, request }) => {
  const board = await seededBoard(request);
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(0);

  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.keyboard.press('n');
  await page.mouse.click(box.x + 300, box.y + 250);
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [created] = await elements(page);

  await expect
    .poll(
      async () => {
        const response = await request.get(`/api/boards/${board.id}`);
        const current = (await response.json()) as { updatedAt: string };
        return current.updatedAt > board.updatedAt;
      },
      { timeout: 8000 },
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  expect(await elements(page)).toEqual([created]);
});
