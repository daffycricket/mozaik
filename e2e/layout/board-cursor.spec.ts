import { type APIRequestContext, type Browser, expect, type Page, test } from '@playwright/test';
import { identityState } from '../support/identity';

test.use({ viewport: { width: 1280, height: 800 } });

type Peer = {
  user: { id: string; name: string; color: string };
  cursor: { x: number; y: number } | null;
};

type BoardApi = {
  getPeers: () => Peer[];
  getOverlayBoxes: () => { cursors: Array<{ x: number; y: number }> };
};

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `UI-BOARD-12 ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(
  browser: Browser,
  boardId: string,
  id: string,
  name: string,
): Promise<{ context: Awaited<ReturnType<Browser['newContext']>>; page: Page }> {
  const context = await browser.newContext({ storageState: identityState(id, name) });
  const page = await context.newPage();
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
  return { context, page };
}

function peerNamed(page: Page, name: string): Promise<Peer | undefined> {
  return page.evaluate((peerName) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    return api?.getPeers().find((candidate) => candidate.user?.name === peerName);
  }, name);
}

test('[UI-BOARD-12] draws a remote cursor at the pointer in the user color with its name', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request);
  const nico = await openBoard(browser, board.id, 'ui-cursor-a', 'Nico L');
  const observer = await openBoard(browser, board.id, 'ui-cursor-b', 'Observateur');

  const box = await nico.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await nico.page.mouse.move(box.x + 300, box.y + 200);

  await expect.poll(() => peerNamed(observer.page, 'Nico L')).toBeDefined();
  const peer = await peerNamed(observer.page, 'Nico L');
  expect(peer?.user.color).toMatch(/^#[0-9a-fA-F]{6}$/);

  await expect
    .poll(async () =>
      observer.page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getOverlayBoxes().cursors.length ?? 0,
      ),
    )
    .toBe(1);

  const [cursor] = await observer.page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getOverlayBoxes().cursors ?? [],
  );
  expect(cursor?.x).toBeCloseTo(300, 0);
  expect(cursor?.y).toBeCloseTo(200, 0);

  await nico.context.close();
  await observer.context.close();
});
