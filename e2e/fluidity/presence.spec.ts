import { type APIRequestContext, type Browser, expect, type Page, test } from '@playwright/test';
import {
  countIntermediatePositions,
  measureActionToEffect,
  type Position,
} from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { identityState } from '../support/identity';
import { median } from '../support/probe';

type Peer = {
  user: { id: string; name: string; color: string };
  cursor: { x: number; y: number } | null;
};

type BoardApi = {
  getPeers: () => Peer[];
};

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité présence ${Date.now()}`, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(browser: Browser, boardId: string, id: string, name: string) {
  const context = await browser.newContext({ storageState: identityState(id, name) });
  const page = await context.newPage();
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
  return { context, page };
}

function lastCursor(page: Page, name: string): Promise<Position | null> {
  return page.evaluate((peerName) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    const peer = api?.getPeers().find((candidate) => candidate.user?.name === peerName);
    return peer?.cursor ?? null;
  }, name);
}

type GestureResult = { distinct: number; delayMs: number };

/**
 * Moves the cursor of the observed user and measures, on the observer page, the
 * number of distinct positions received and the delay of the last one (FL-4).
 */
async function runGesture(
  actor: Page,
  observer: Page,
  box: { x: number; y: number },
): Promise<GestureResult> {
  const start = { x: box.x + 200, y: box.y + 200 };
  await actor.mouse.move(start.x, start.y);
  // Pacing the gesture over about one second is what produces several distinct
  // positions once the 50 ms send throttle is applied (F10-S2-AC2, FL-4).
  await observer.waitForTimeout(100);
  const samples: Position[] = [];
  for (let step = 1; step <= 10; step += 1) {
    await actor.mouse.move(start.x + step * 25, start.y + step * 8);
    await observer.waitForTimeout(60);
    const cursor = await lastCursor(observer, 'Nico L');
    if (cursor !== null) {
      samples.push(cursor);
    }
  }

  const final = { x: box.x + 500, y: box.y + 320 };
  const delayMs = await measureActionToEffect(
    observer,
    () => actor.mouse.move(final.x, final.y),
    () =>
      expect
        .poll(() => lastCursor(observer, 'Nico L'))
        .toEqual({ x: final.x - box.x, y: final.y - box.y }),
  );

  return { distinct: countIntermediatePositions(samples), delayMs };
}

test('[F10-S2-AC2] shows continuous remote cursor movement within the latency budget', async ({
  browser,
  request,
}, testInfo) => {
  const board = await seededBoard(request);
  const nico = await openBoard(browser, board.id, 'presence-nico', 'Nico L');
  const lama = await openBoard(browser, board.id, 'presence-lama', 'Lama Flamboyant');

  const box = await nico.page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }

  const results: GestureResult[] = [];
  for (let run = 0; run < 3; run += 1) {
    results.push(await runGesture(nico.page, lama.page, box));
  }

  const distinct = median(results.map((result) => result.distinct));
  const delayMs = median(results.map((result) => result.delayMs));

  recordFluidityMeasure({
    requirement: 'FL-4',
    scenario: 'Déplacement continu du curseur distant (F10-S2-AC2)',
    measuredMs: delayMs,
    threshold: '≥ 5 positions intermédiaires, dernière ≤ 500 ms',
    video: videoPathFor(testInfo),
  });

  expect(distinct).toBeGreaterThanOrEqual(5);
  expect(delayMs).toBeLessThanOrEqual(500);

  await nico.context.close();
  await lama.context.close();
});
