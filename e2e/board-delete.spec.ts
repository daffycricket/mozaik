import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { storedIdentityState } from './support/identity';

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

async function openDeleteDialog(page: Page, name: string): Promise<void> {
  await page.goto('/');
  const row = page.getByTestId('board-item').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByTestId('board-delete').click();
  await expect(page.getByTestId('delete-dialog')).toBeVisible();
}

test('[F01-S4-AC1] deletes a board after confirmation and makes it unavailable', async ({
  page,
  request,
}) => {
  const name = `Supprimer ${Date.now()}`;
  const board = await createBoard(request, name);

  await openDeleteDialog(page, name);
  await page.getByTestId('delete-confirm').click();

  await expect(page.getByTestId('board-item').filter({ hasText: name })).toHaveCount(0);
  const read = await request.get(`/api/boards/${board.id}`);
  expect(read.status()).toBe(404);
});

test('[F01-S4-AC2] keeps the board when the dialog is cancelled', async ({ page, request }) => {
  const name = `Annuler ${Date.now()}`;
  const board = await createBoard(request, name);

  await openDeleteDialog(page, name);
  await page.getByTestId('delete-cancel').click();

  await expect(page.getByTestId('delete-dialog')).toHaveCount(0);
  await expect(page.getByTestId('board-item').filter({ hasText: name })).toBeVisible();
  const read = await request.get(`/api/boards/${board.id}`);
  expect(read.status()).toBe(200);
});

test('[F01-S4-AC4] tells a user on the board that it has been deleted by someone else', async ({
  browser,
  request,
}) => {
  const name = `Supprimé ${Date.now()}`;
  const board = await createBoard(request, name);

  const contextA = await browser.newContext({ storageState: storedIdentityState() });
  const pageA = await contextA.newPage();
  await pageA.goto(`/b/${board.id}`);
  await expect(pageA.getByTestId('board-canvas').locator('canvas')).toBeVisible();

  const contextB = await browser.newContext({ storageState: storedIdentityState() });
  const pageB = await contextB.newPage();
  await openDeleteDialog(pageB, name);
  await pageB.getByTestId('delete-confirm').click();
  await expect(pageB.getByTestId('board-item').filter({ hasText: name })).toHaveCount(0);

  const deleted = pageA.getByTestId('board-deleted');
  await expect(deleted).toBeVisible();
  await expect(deleted).toContainText('Ce board a été supprimé');

  await deleted.getByTestId('nav-boards').click();
  await expect(pageA).toHaveURL(/\/$/);
  await expect(pageA.getByTestId('board-create')).toBeVisible();

  await contextA.close();
  await contextB.close();
});
