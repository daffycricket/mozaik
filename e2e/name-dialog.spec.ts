import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { storedIdentityState } from './support/identity';

const EMPTY_STORAGE = { cookies: [], origins: [] };

test.use({ storageState: EMPTY_STORAGE });

async function createBoard(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/boards', { data: { name: 'Board F10-S1' } });
  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string };
  return board.id;
}

async function openDirectBoard(page: Page, request: APIRequestContext): Promise<void> {
  const boardId = await createBoard(request);
  await page.goto(`/b/${boardId}`);
}

test('[F10-S1-AC1] asks for the name before showing a board opened by direct URL', async ({
  page,
  request,
}) => {
  await openDirectBoard(page, request);

  await expect(page.getByTestId('name-dialog')).toBeVisible();
  await expect(page.getByTestId('board-canvas')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(false);

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('name-dialog')).toBeVisible();
});

test('[F10-S1-AC2] asks for the name when entering a board from the menu', async ({ page }) => {
  await page.goto('/');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.getByTestId('board-create').click();
  await created;

  await expect(page.getByTestId('name-dialog')).toBeVisible();
  await expect(page.getByTestId('board-canvas')).toHaveCount(0);
});

test('[F10-S1-AC3] enters the board with Enter and memorizes the name', async ({
  page,
  request,
}) => {
  await openDirectBoard(page, request);

  await page.getByTestId('name-input').fill('Lama Flamboyant');
  await page.getByTestId('name-input').press('Enter');

  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('mozaik.identity'));
  const identity = JSON.parse(stored ?? '{}') as { id?: string; name?: string };
  expect(identity.name).toBe('Lama Flamboyant');
  expect(identity.id).toBeTruthy();
});

test('[F10-S1-AC3] enters the board with the submit button', async ({ page, request }) => {
  await openDirectBoard(page, request);

  await page.getByTestId('name-input').fill('Nico L');
  await page.getByTestId('name-submit').click();

  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
});

test('[F10-S1-AC4] rejects an empty, blank or too long name', async ({ page, request }) => {
  await openDirectBoard(page, request);

  const input = page.getByTestId('name-input');
  const submit = page.getByTestId('name-submit');

  await submit.click();
  await expect(page.getByTestId('name-error')).toBeVisible();

  await input.fill('   ');
  await submit.click();
  await expect(page.getByTestId('name-error')).toBeVisible();

  await input.fill('x'.repeat(31));
  await submit.click();
  await expect(page.getByTestId('name-error')).toBeVisible();

  await expect(page.getByTestId('name-dialog')).toBeVisible();
  await expect(page.getByTestId('board-canvas')).toHaveCount(0);
});

test.describe('with a memorized name', () => {
  test.use({ storageState: storedIdentityState() });

  test('[F10-S1-AC5] does not ask for the name again', async ({ page, request }) => {
    const boardId = await createBoard(request);

    await page.goto(`/b/${boardId}`);
    await expect(page.getByTestId('board-canvas')).toBeVisible();
    await expect(page.getByTestId('name-dialog')).toHaveCount(0);

    await page.goto('/');
    await page.getByTestId('board-create').click();
    await expect(page.getByTestId('board-canvas')).toBeVisible();
  });
});

test('[F10-S1-AC6] going back to the boards does not enter the board', async ({
  page,
  request,
}) => {
  await openDirectBoard(page, request);
  await expect(page.getByTestId('name-dialog')).toBeVisible();

  await page.getByTestId('name-back').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('board-create')).toBeVisible();
  await expect(page.getByTestId('board-canvas')).toHaveCount(0);
});
