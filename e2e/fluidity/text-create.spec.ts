import { type APIRequestContext, type Browser, expect, type Page, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { identityState } from '../support/identity';
import { median } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Point = { x: number; y: number };
type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type BoardApi = {
  getElements: () => BoardElement[];
  worldToScreen: (point: Point) => Point;
};

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité texte ${Date.now()}`, elements },
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

async function openBoard(page: Page, boardId: string, elements: number): Promise<void> {
  await page.goto(`/b/${boardId}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(() => elementCount(page)).toBe(elements);
}

async function createTextAt(page: Page, point: Point): Promise<void> {
  const screen = await page.evaluate((value) => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.worldToScreen(value);
  }, point);
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.keyboard.press('t');
  await page.mouse.click(box.x + screen.x, box.y + screen.y);
  await expect(page.getByTestId('text-editor')).toBeVisible();
}

async function openAs(browser: Browser, boardId: string, id: string, name: string): Promise<Page> {
  const context = await browser.newContext({ storageState: identityState(id, name) });
  const page = await context.newPage();
  await openBoard(page, boardId, 1);
  return page;
}

test('[F05-S1-AC4] keeps typing immediate and lossless on a board of 300 elements', async ({
  page,
  request,
}, testInfo) => {
  await addWebSocketLatency(page, 300);
  const board = await seededBoard(request, 300);
  await openBoard(page, board.id, 300);
  await createTextAt(page, { x: 1200, y: 110 });

  const editor = page.getByTestId('text-editor');
  const typed = 'lorem ipsum dolor sit amet '.repeat(20).slice(0, 200);

  await editor.fill('');
  await page.keyboard.type(typed, { delay: 0 });
  await expect.poll(() => editor.inputValue()).toBe(typed);

  const durations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const expectedLength = typed.length + run + 1;
    durations.push(
      await measureActionToEffect(
        page,
        () => page.keyboard.type('x', { delay: 0 }),
        (length: number) => {
          const browser = globalThis as unknown as {
            document: { querySelector: (selector: string) => { value: string } | null };
          };
          const target = browser.document.querySelector('[data-testid="text-editor"]');
          return target !== null && target.value.length === length;
        },
        expectedLength,
      ),
    );
  }

  const medianTypingMs = median(durations);
  recordFluidityMeasure({
    requirement: 'FL-1',
    scenario: 'Frappe dans un texte libre sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianTypingMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  recordFluidityMeasure({
    requirement: 'FL-6',
    scenario: 'Frappe rapide de 200 caractères dans un texte libre',
    measuredMs: null,
    threshold: 'binaire : aucun caractère perdu ni réordonné',
    video: videoPathFor(testInfo),
  });
  expect(medianTypingMs).toBeLessThanOrEqual(150);

  await page.keyboard.press('Escape');
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (globalThis as { __board?: BoardApi }).__board
            ?.getElements()
            .find((element) => element.type === 'text')?.text ?? '',
      ),
    )
    .toBe(`${typed}xxx`);
});

test('[F05-S1-AC4] keeps the edited text and cursor when another user changes the board', async ({
  browser,
  request,
}, testInfo) => {
  const board = await seededBoard(request, 1);
  const pageA = await openAs(browser, board.id, 'text-user-a', 'Alice');
  const pageB = await openAs(browser, board.id, 'text-user-b', 'Bob');

  await createTextAt(pageA, { x: 1200, y: 110 });
  const editorA = pageA.getByTestId('text-editor');
  await editorA.fill('Idée');
  await editorA.evaluate((element) => {
    (
      element as unknown as { setSelectionRange: (start: number, end: number) => void }
    ).setSelectionRange(2, 2);
  });

  const box = await pageB.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await pageB.keyboard.press('n');
  await pageB.mouse.click(box.x + 500, box.y + 400);

  await expect.poll(() => elementCount(pageA), { timeout: 10_000 }).toBe(3);

  recordFluidityMeasure({
    requirement: 'FL-5',
    scenario: 'Édition d’un texte libre pendant qu’un autre utilisateur modifie le board',
    measuredMs: null,
    threshold: 'binaire : contenu et curseur conservés',
    video: videoPathFor(testInfo),
  });

  await expect(editorA).toBeVisible();
  await expect(editorA).toBeFocused();
  await expect(editorA).toHaveValue('Idée');
  const selectionStart = await editorA.evaluate(
    (element) => (element as unknown as { selectionStart: number | null }).selectionStart,
  );
  expect(selectionStart).toBe(2);
});
