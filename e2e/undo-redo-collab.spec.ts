import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { identityState } from './support/identity';

type BoardElement = { id: string };

type BoardApi = { getElements: () => BoardElement[] };

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

function elementIds(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      (globalThis as { __board?: BoardApi }).__board?.getElements().map((element) => element.id) ??
      [],
  );
}

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Isolation ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function createStickyAt(page: Page, x: number, y: number): Promise<void> {
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.keyboard.press('n');
  await page.mouse.click(box.x + x, box.y + y);
}

test('[F08-S2-AC2] undoing a local creation leaves the other user element untouched', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request);

  const contextA = await browser.newContext({
    storageState: identityState('undo-user-a', 'Alice'),
  });
  const contextB = await browser.newContext({
    storageState: identityState('undo-user-b', 'Bob'),
  });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto(`/b/${board.id}`);
  await pageB.goto(`/b/${board.id}`);
  await expect(pageA.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect(pageB.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(pageA);
  await waitForBoardApi(pageB);

  await createStickyAt(pageA, 300, 250);
  await expect.poll(() => elementIds(pageA)).toHaveLength(1);
  const [elementA] = await elementIds(pageA);
  if (elementA === undefined) {
    throw new Error('Expected Alice to have created an element');
  }

  await createStickyAt(pageB, 500, 350);
  await expect.poll(() => elementIds(pageB)).toHaveLength(2);
  await expect.poll(() => elementIds(pageA)).toHaveLength(2);
  const elementB = (await elementIds(pageB)).find((id) => id !== elementA);
  if (elementB === undefined) {
    throw new Error('Expected Bob to have created an element');
  }

  await pageA.keyboard.press('Control+z');

  await expect.poll(() => elementIds(pageA)).toEqual([elementB]);
  await expect.poll(() => elementIds(pageB)).toEqual([elementB]);

  await contextA.close();
  await contextB.close();
});
