import { type APIRequestContext, type Browser, expect, type Page, test } from '@playwright/test';
import { measureActionToEffect } from '../support/action-effect';
import { recordFluidityMeasure, videoPathFor } from '../support/fluidity-report';
import { identityState } from '../support/identity';
import { median } from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type Point = { x: number; y: number };
type StickyElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type BoardApi = {
  getElements: () => StickyElement[];
  worldToScreen: (point: Point) => Point;
};

async function seededBoard(request: APIRequestContext, elements: number): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name: `Fluidité édition ${Date.now()}`, elements },
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

async function doubleClickFirstSticky(page: Page): Promise<void> {
  const [sticky] = await page.evaluate(
    () => (globalThis as { __board?: BoardApi }).__board?.getElements() ?? [],
  );
  if (sticky === undefined) {
    throw new Error('Expected a sticky note');
  }
  const screen = await page.evaluate(
    (point) => {
      const api = (globalThis as { __board?: BoardApi }).__board;
      if (api === undefined) {
        throw new Error('board API not exposed');
      }
      return api.worldToScreen(point);
    },
    { x: sticky.x + sticky.width / 2, y: sticky.y + sticky.height / 2 },
  );
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.mouse.dblclick(box.x + screen.x, box.y + screen.y);
  await expect(page.getByTestId('text-editor')).toBeVisible();
}

async function openAs(browser: Browser, boardId: string, id: string, name: string): Promise<Page> {
  const context = await browser.newContext({ storageState: identityState(id, name) });
  const page = await context.newPage();
  await openBoard(page, boardId, 1);
  return page;
}

test('[F03-S2-AC5] keeps typing immediate and lossless on a board of 300 elements', async ({
  page,
  request,
}, testInfo) => {
  await addWebSocketLatency(page, 300);
  const board = await seededBoard(request, 300);
  await openBoard(page, board.id, 300);
  await doubleClickFirstSticky(page);

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
    scenario: 'Frappe dans un post-it sur un board de 300 éléments (300 ms de latence)',
    measuredMs: medianTypingMs,
    threshold: '≤ 150 ms',
    video: videoPathFor(testInfo),
  });
  expect(medianTypingMs).toBeLessThanOrEqual(150);

  await page.keyboard.press('Escape');
  await expect
    .poll(async () =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getElements()[0]?.text ?? '',
      ),
    )
    .toBe(`${typed}xxx`);
});

test('[F03-S2-AC5] keeps the edited text and cursor when another user changes the board', async ({
  browser,
  request,
}, testInfo) => {
  const board = await seededBoard(request, 1);
  const pageA = await openAs(browser, board.id, 'edit-user-a', 'Alice');
  const pageB = await openAs(browser, board.id, 'edit-user-b', 'Bob');

  await doubleClickFirstSticky(pageA);
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

  await expect.poll(() => elementCount(pageA), { timeout: 10_000 }).toBe(2);

  recordFluidityMeasure({
    requirement: 'FL-5',
    scenario: 'Édition d’un post-it pendant qu’un autre utilisateur modifie le board',
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
