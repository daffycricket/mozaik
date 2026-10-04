import { expect, type Page, test } from '@playwright/test';

type BoardApi = {
  getElements: () => unknown[];
  getViewport: () => { x: number; y: number; zoom: number };
  worldToScreen: (point: { x: number; y: number }) => { x: number; y: number };
  screenToWorld: (point: { x: number; y: number }) => { x: number; y: number };
  getSelection: () => string[];
  getPeers: () => unknown[];
};

async function openNewBoard(page: Page): Promise<void> {
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.goto('/');
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
}

test('[T-003-AC3] connects the board page to the collaboration document', async ({ page }) => {
  const sockets: string[] = [];
  page.on('websocket', (socket) => {
    sockets.push(socket.url());
  });

  await openNewBoard(page);

  await expect.poll(() => sockets.some((url) => url.includes('/collab'))).toBe(true);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getElements().length ?? null,
      ),
    )
    .toBe(0);
});

test('[T-003-AC4] exposes the read-only board API on an empty board', async ({ page }) => {
  await openNewBoard(page);

  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: BoardApi }).__board !== undefined))
    .toBe(true);

  const snapshot = await page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      return null;
    }
    return {
      elements: api.getElements(),
      viewport: api.getViewport(),
      worldToScreen: api.worldToScreen({ x: 10, y: 20 }),
      screenToWorld: api.screenToWorld({ x: 30, y: 40 }),
      selection: api.getSelection(),
      peers: api.getPeers(),
    };
  });

  expect(snapshot).toEqual({
    elements: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    worldToScreen: { x: 10, y: 20 },
    screenToWorld: { x: 30, y: 40 },
    selection: [],
    peers: [],
  });
});
