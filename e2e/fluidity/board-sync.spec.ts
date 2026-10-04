import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { E2E_WEB_ORIGIN, IDENTITY_STORAGE_KEY } from '../support/identity';
import { median } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type BoardApi = { getElements: () => unknown[] };

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
    data: { name: `Fluidité synchronisation ${Date.now()}`, elements: 1 },
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

test('[F09-S1-AC4] keeps creation immediate locally and lossless remotely under latency', async ({
  browser,
  request,
}, testInfo) => {
  const board = await seededBoard(request);

  const contextA = await browser.newContext({
    storageState: identityState('sync-user-a', 'Alice'),
  });
  const contextB = await browser.newContext({
    storageState: identityState('sync-user-b', 'Bob'),
  });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await addWebSocketLatency(pageA, 300);

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

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    await pageA.keyboard.press('n');
    const point = { x: box.x + 300 + run * 80, y: box.y + 250 };
    const expected = 2 + run;
    durations.push(
      await measureActionToEffect(
        pageA,
        () => pageA.mouse.click(point.x, point.y),
        () => expect.poll(() => elementCount(pageA)).toBe(expected),
      ),
    );
  }

  const medianCreateMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Création d’un post-it avec 300 ms de latence réseau (F09-S1-AC4)',
    measuredMs: medianCreateMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  expect(medianCreateMs).toBeLessThanOrEqual(150);

  await expect.poll(() => elementCount(pageB), { timeout: 10_000 }).toBe(4);

  await contextA.close();
  await contextB.close();
});
