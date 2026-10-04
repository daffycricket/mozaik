import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from '@playwright/test';
import { identityState } from './support/identity';

type Peer = {
  user: { id: string; name: string; color: string };
  cursor: { x: number; y: number } | null;
};

type BoardApi = {
  getPeers: () => Peer[];
  worldToScreen: (point: { x: number; y: number }) => { x: number; y: number };
  getOverlayBoxes: () => { cursors: Array<{ x: number; y: number }> };
};

type OpenedBoard = { context: BrowserContext; page: Page };

async function seededBoard(request: APIRequestContext, name: string): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `${name} ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(
  browser: Browser,
  boardId: string,
  id: string,
  name: string,
): Promise<OpenedBoard> {
  const context = await browser.newContext({ storageState: identityState(id, name) });
  const page = await context.newPage();
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  return { context, page };
}

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

function readPeers(page: Page): Promise<Peer[]> {
  return page.evaluate(
    () => ((globalThis as { __board?: BoardApi }).__board?.getPeers() ?? []) as Peer[],
  );
}

async function peerNamed(page: Page, name: string): Promise<Peer | undefined> {
  return (await readPeers(page)).find((peer) => peer.user?.name === name);
}

function overlayCursors(page: Page): Promise<Array<{ x: number; y: number }>> {
  return page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getOverlayBoxes().cursors ?? [],
  );
}

function canvasCenter(box: { x: number; y: number }): { x: number; y: number } {
  return { x: box.x + 400, y: box.y + 300 };
}

test('[F10-S2-AC1] shows a named and colored cursor at the world position of another user', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request, 'Presence AC1');
  const nico = await openBoard(browser, board.id, 'presence-nico', 'Nico L');
  const lama = await openBoard(browser, board.id, 'presence-lama', 'Lama Flamboyant');

  const box = await nico.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  const point = canvasCenter(box);
  await nico.page.mouse.move(point.x, point.y);

  await expect
    .poll(async () => (await peerNamed(lama.page, 'Nico L'))?.cursor ?? null)
    .not.toBeNull();

  const peer = await peerNamed(lama.page, 'Nico L');
  if (peer === undefined || peer.cursor === null) {
    throw new Error('Expected the peer cursor to be published');
  }
  expect(peer.user.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  expect(Math.abs(peer.cursor.x - 400)).toBeLessThanOrEqual(2);
  expect(Math.abs(peer.cursor.y - 300)).toBeLessThanOrEqual(2);

  await expect.poll(async () => (await overlayCursors(lama.page)).length).toBe(1);
  const [cursor] = await overlayCursors(lama.page);
  expect(cursor?.x).toBeCloseTo(400, 0);
  expect(cursor?.y).toBeCloseTo(300, 0);

  await nico.context.close();
  await lama.context.close();
});

test('[F10-S2-AC3] hides a cursor that is outside the visible area', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request, 'Presence AC3');
  const nico = await openBoard(browser, board.id, 'presence-nico', 'Nico L');
  const lama = await openBoard(browser, board.id, 'presence-lama', 'Lama Flamboyant');

  const box = await nico.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await nico.page.mouse.move(box.x + 400, box.y + 300);
  await expect
    .poll(async () => (await peerNamed(lama.page, 'Nico L'))?.cursor ?? null)
    .not.toBeNull();
  await expect.poll(async () => (await overlayCursors(lama.page)).length).toBe(1);

  await lama.page.keyboard.press('h');
  await lama.page.mouse.move(700, 400);
  await lama.page.mouse.down();
  await lama.page.mouse.move(200, 400, { steps: 5 });
  await lama.page.mouse.up();

  await expect.poll(async () => (await overlayCursors(lama.page)).length).toBe(0);
  expect(await peerNamed(lama.page, 'Nico L')).toBeDefined();

  await nico.context.close();
  await lama.context.close();
});

test('[F10-S2-AC4] removes the cursor of a user who leaves', async ({ browser, request }) => {
  const board = await seededBoard(request, 'Presence AC4');
  const nico = await openBoard(browser, board.id, 'presence-nico', 'Nico L');
  const lama = await openBoard(browser, board.id, 'presence-lama', 'Lama Flamboyant');

  const box = await nico.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await nico.page.mouse.move(box.x + 400, box.y + 300);
  await expect.poll(async () => (await peerNamed(lama.page, 'Nico L')) !== undefined).toBe(true);

  await nico.context.close();

  await expect
    .poll(async () => (await peerNamed(lama.page, 'Nico L')) !== undefined, {
      timeout: 5000,
      intervals: [100, 200, 500],
    })
    .toBe(false);

  await lama.context.close();
});

test('[F10-S2-AC5] shows the cursors of two other users with distinct colors', async ({
  browser,
  request,
}) => {
  const board = await seededBoard(request, 'Presence AC5');
  const alice = await openBoard(browser, board.id, 'presence-a', 'Alice');
  const bob = await openBoard(browser, board.id, 'presence-b', 'Bob');
  const carol = await openBoard(browser, board.id, 'presence-c', 'Carol');

  const box = await alice.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await alice.page.mouse.move(box.x + 200, box.y + 200);
  await bob.page.mouse.move(box.x + 500, box.y + 300);

  await expect
    .poll(async () => (await readPeers(carol.page)).filter((peer) => peer.cursor !== null).length)
    .toBe(2);

  const cursors = (await readPeers(carol.page)).filter((peer) => peer.cursor !== null);
  expect(new Set(cursors.map((peer) => peer.user.name))).toEqual(new Set(['Alice', 'Bob']));
  expect(new Set(cursors.map((peer) => peer.user.color)).size).toBe(2);

  await alice.context.close();
  await bob.context.close();
  await carol.context.close();
});
