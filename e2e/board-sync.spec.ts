import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { E2E_WEB_ORIGIN, IDENTITY_STORAGE_KEY } from './support/identity';

type BoardApi = { getElements: () => unknown[] };

/**
 * Storage state for a distinct collaboration user, so two contexts count as two users.
 */
function identityState(
  id: string,
  name: string,
): {
  cookies: [];
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
} {
  return {
    cookies: [],
    origins: [
      {
        origin: E2E_WEB_ORIGIN,
        localStorage: [{ name: IDENTITY_STORAGE_KEY, value: JSON.stringify({ id, name }) }],
      },
    ],
  };
}

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Synchronisation ${Date.now()}`, elements: 1 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

function elementCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? 0,
  );
}

test('[F09-S1-AC1] propagates a sticky created by one user to a second user', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request);

  const contextA = await browser.newContext({
    storageState: identityState('sync-user-a', 'Alice'),
  });
  const contextB = await browser.newContext({
    storageState: identityState('sync-user-b', 'Bob'),
  });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto(`/b/${board.id}`);
  await pageB.goto(`/b/${board.id}`);
  await expect(pageA.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect(pageB.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(pageA);
  await waitForBoardApi(pageB);
  await expect.poll(() => elementCount(pageA)).toBe(1);
  await expect.poll(() => elementCount(pageB)).toBe(1);

  const box = await pageA.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }

  await pageA.keyboard.press('n');
  const start = Date.now();
  await pageA.mouse.click(box.x + 300, box.y + 250);

  await expect
    .poll(() => elementCount(pageB), { intervals: [20, 20, 50, 100, 200], timeout: 5000 })
    .toBe(2);
  expect(Date.now() - start).toBeLessThanOrEqual(500);

  await contextA.close();
  await contextB.close();
});
