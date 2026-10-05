import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

type Point = { x: number; y: number };

type BoardElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
  text?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

type BoardApi = {
  getElements: () => BoardElement[];
  getSelection: () => string[];
};

async function waitForBoardApi(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(true);
}

async function elements(page: Page): Promise<BoardElement[]> {
  return page.evaluate(() => {
    const api = (globalThis as { __board?: BoardApi }).__board;
    if (api === undefined) {
      throw new Error('board API not exposed');
    }
    return api.getElements();
  });
}

async function selection(page: Page): Promise<string[]> {
  return page.evaluate(() => (globalThis as { __board?: BoardApi }).__board?.getSelection() ?? []);
}

async function seededBoard(request: APIRequestContext, name: string): Promise<{ id: string }> {
  const response = await request.post('/api/test/seed', {
    data: { name, elements: 0 },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string };
}

async function openBoard(page: Page, id: string): Promise<void> {
  await page.goto(`/b/${id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(0);
}

async function canvasPoint(page: Page, point: Point): Promise<Point> {
  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  return { x: box.x + point.x, y: box.y + point.y };
}

async function createSticky(page: Page, point: Point): Promise<BoardElement> {
  await page.keyboard.press('n');
  const target = await canvasPoint(page, point);
  await page.mouse.click(target.x, target.y);
  await expect.poll(async () => (await elements(page)).length).toBe(1);
  const [sticky] = await elements(page);
  if (sticky === undefined) {
    throw new Error('Expected the sticky note to be created');
  }
  return sticky;
}

async function createText(page: Page, point: Point, value: string): Promise<BoardElement> {
  await page.keyboard.press('t');
  const target = await canvasPoint(page, point);
  await page.mouse.click(target.x, target.y);
  const editor = page.getByTestId('text-editor');
  await expect(editor).toBeVisible();
  await editor.fill(value);
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
  const text = (await elements(page)).find((element) => element.type === 'text');
  if (text === undefined) {
    throw new Error('Expected the text element to be created');
  }
  return text;
}

async function createArrow(page: Page, from: Point, to: Point): Promise<BoardElement> {
  await page.keyboard.press('a');
  const start = await canvasPoint(page, from);
  const end = await canvasPoint(page, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
  const arrow = (await elements(page)).find((element) => element.type === 'arrow');
  if (arrow === undefined) {
    throw new Error('Expected the arrow to be created');
  }
  return arrow;
}

function offsetOf(copy: BoardElement, original: BoardElement): Point {
  if (copy.type === 'arrow') {
    return { x: (copy.x1 ?? 0) - (original.x1 ?? 0), y: (copy.y1 ?? 0) - (original.y1 ?? 0) };
  }
  return { x: copy.x - original.x, y: copy.y - original.y };
}

test('[F08-S3-AC1] duplicates a sticky, a text and an arrow above the originals', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, `Dupliquer ${Date.now()}`);
  await openBoard(page, board.id);

  const sticky = await createSticky(page, { x: 350, y: 250 });
  const text = await createText(page, { x: 650, y: 250 }, 'Bonjour');
  const arrow = await createArrow(page, { x: 350, y: 470 }, { x: 560, y: 470 });
  const originals = [sticky, text, arrow];
  const originalIds = originals.map((element) => element.id);

  await page.keyboard.press('Control+a');
  await expect.poll(() => selection(page)).toHaveLength(3);

  await page.keyboard.press('Control+d');
  await expect.poll(async () => (await elements(page)).length).toBe(6);

  const copied = await elements(page);
  const copies = copied.filter((element) => !originalIds.includes(element.id));
  expect(copies).toHaveLength(3);
  expect(await selection(page)).toHaveLength(3);
  for (const copy of copies) {
    expect(originalIds).not.toContain(copy.id);
  }

  const highestOriginal = [...originals.map((element) => element.zIndex)].sort().at(-1) as string;
  for (const copy of copies) {
    const original = originals.find((element) => element.type === copy.type);
    if (original === undefined) {
      throw new Error(`Expected an original of type ${copy.type}`);
    }
    expect(offsetOf(copy, original)).toEqual({ x: 20, y: 20 });
    expect(copy.zIndex > highestOriginal).toBe(true);
    if (copy.type === 'text') {
      expect(copy.text).toBe('Bonjour');
    }
  }
});

test('[F08-S3-AC2] copies and pastes the selection in the same board', async ({
  page,
  request,
}) => {
  const board = await seededBoard(request, `Coller ${Date.now()}`);
  await openBoard(page, board.id);

  const sticky = await createSticky(page, { x: 420, y: 320 });
  await expect.poll(() => selection(page)).toEqual([sticky.id]);

  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await elements(page)).length).toBe(2);

  const copy = (await elements(page)).find((element) => element.id !== sticky.id);
  if (copy === undefined) {
    throw new Error('Expected a pasted element');
  }
  expect(offsetOf(copy, sticky)).toEqual({ x: 20, y: 20 });
  await expect.poll(() => selection(page)).toEqual([copy.id]);
});

test('[F08-S3-AC3] copies in one board and pastes in another with new ids', async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const source = await seededBoard(request, `Source ${suffix}`);
  const targetName = `Cible ${suffix}`;
  const target = await seededBoard(request, targetName);

  await openBoard(page, source.id);
  const sticky = await createSticky(page, { x: 430, y: 330 });
  await expect.poll(() => selection(page)).toEqual([sticky.id]);

  await page.keyboard.press('Control+c');

  await page.getByTestId('nav-boards').click();
  await expect(page.getByTestId('board-create')).toBeVisible();
  await page.getByTestId('board-item').filter({ hasText: targetName }).getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/b/${target.id}$`));
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await waitForBoardApi(page);
  await expect.poll(async () => (await elements(page)).length).toBe(0);

  await page.keyboard.press('Control+v');
  await expect.poll(async () => (await elements(page)).length).toBe(1);

  const [pasted] = await elements(page);
  if (pasted === undefined) {
    throw new Error('Expected a pasted element');
  }
  expect(pasted.id).not.toBe(sticky.id);
  expect(pasted.type).toBe('sticky');
  expect(offsetOf(pasted, sticky)).toEqual({ x: 20, y: 20 });
  await expect.poll(() => selection(page)).toEqual([pasted.id]);
});
