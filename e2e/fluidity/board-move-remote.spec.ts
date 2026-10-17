import { type APIRequestContext, type Browser, expect, type Page, test } from '@playwright/test';
import {
  countIntermediatePositions,
  measureActionToEffect,
  type Position,
} from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { identityState } from '../support/identity';

type Point = { x: number; y: number };
type BoardElement = { id: string; x: number; y: number; width: number; height: number };
type Viewport = { x: number; y: number; zoom: number };

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
};

async function seededBoard(request: APIRequestContext): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité déplacement distant ${Date.now()}`, elements: 2 },
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

async function elementById(page: Page, id: string): Promise<BoardElement> {
  const element = await page.evaluate((elementId) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    return api?.getElements().find((candidate) => candidate.id === elementId) ?? null;
  }, id);
  if (element === null) {
    throw new Error(`Expected element ${id}`);
  }
  return element;
}

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
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

async function pagePoint(page: Page, world: Point): Promise<Point> {
  const screen = await page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, world);
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { x: box.x + screen.x, y: box.y + screen.y };
}

function center(element: BoardElement): Point {
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

test('[F07-S2-AC5] shows a remote drag continuously without disturbing the observer', async ({
  browser,
  request,
}, testInfo) => {
  const board = await seededBoard(request);
  const alice = await openBoard(browser, board.id, 'move-user-a', 'Alice');
  const bob = await openBoard(browser, board.id, 'move-user-b', 'Bob');

  const [moved, watched] = await alice.page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    return api?.getElements() ?? [];
  });
  if (moved === undefined || watched === undefined) {
    throw new Error('Expected two seeded elements');
  }

  const watchedCenter = await pagePoint(bob.page, center(watched));
  await bob.page.mouse.click(watchedCenter.x, watchedCenter.y);
  await expect.poll(() => selection(bob.page)).toEqual([watched.id]);
  const watchedStart = await elementById(bob.page, watched.id);
  const bobViewport = await viewport(bob.page);

  const start = await pagePoint(alice.page, center(moved));
  await alice.page.mouse.move(start.x, start.y);
  await alice.page.mouse.down();

  const samples: Position[] = [];
  for (let step = 1; step <= 10; step += 1) {
    await alice.page.mouse.move(start.x + step * 20, start.y + step * 6);
    await bob.page.waitForTimeout(60);
    const position = await elementById(bob.page, moved.id);
    samples.push({ x: position.x, y: position.y });
  }

  const zoom = (await viewport(alice.page)).zoom;
  const finalScreen = { x: start.x + 10 * 20 + 30, y: start.y + 10 * 6 + 10 };
  const expected = {
    x: moved.x + (finalScreen.x - start.x) / zoom,
    y: moved.y + (finalScreen.y - start.y) / zoom,
  };
  const delayMs = await measureActionToEffect(
    bob.page,
    () => alice.page.mouse.move(finalScreen.x, finalScreen.y),
    (target: { id: string; x: number; y: number }) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      const element = api?.getElements().find((candidate) => candidate.id === target.id);
      return element !== undefined && element.x === target.x && element.y === target.y;
    },
    { id: moved.id, x: expected.x, y: expected.y },
  );
  await alice.page.mouse.up();

  const distinct = countIntermediatePositions(samples);
  const medianDistinct = distinct;

  recordFluidityMeasure({
    requirement: 'FL-4',
    scenario: 'Déplacement continu d’un élément vu par un autre utilisateur (F07-S2-AC5)',
    measuredMs: delayMs,
    threshold: '≥ 5 positions intermédiaires, dernière ≤ 500 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-5',
    scenario: 'Sélection et viewport de l’observateur stables pendant un déplacement distant',
    measuredMs: null,
    threshold: 'binaire : sélection, élément observé et viewport conservés',
    video: videoPathFor(testInfo),
  });

  expect(medianDistinct).toBeGreaterThanOrEqual(5);
  expect(delayMs).toBeLessThanOrEqual(500);

  const watchedEnd = await elementById(bob.page, watched.id);
  expect({ x: watchedEnd.x, y: watchedEnd.y }).toEqual({ x: watchedStart.x, y: watchedStart.y });
  expect(await selection(bob.page)).toEqual([watched.id]);
  expect(await viewport(bob.page)).toEqual(bobViewport);

  await alice.context.close();
  await bob.context.close();
});
