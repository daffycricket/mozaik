import { type APIRequestContext, expect, test } from '@playwright/test';

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

test('[F01-S3-AC1] renames a board from its header and shows the new name on the menu', async ({
  page,
  request,
}) => {
  const board = await createBoard(request, `Renommer ${Date.now()}`);

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-name')).toHaveText(board.name);

  await page.getByTestId('board-name').click();
  const input = page.getByTestId('board-name-input');
  await expect(input).toBeVisible();
  await input.fill('Atelier vision');
  await input.press('Enter');

  await expect(page.getByTestId('board-name')).toHaveText('Atelier vision');

  const persisted = await request.get(`/api/boards/${board.id}`);
  expect(((await persisted.json()) as { name: string }).name).toBe('Atelier vision');

  await page.getByTestId('nav-boards').click();
  await expect(page.getByTestId('board-item').filter({ hasText: 'Atelier vision' })).toBeVisible();
});

test('[F01-S3-AC2] keeps the previous name when Escape cancels the edition', async ({
  page,
  request,
}) => {
  const board = await createBoard(request, `Annuler ${Date.now()}`);

  await page.goto(`/b/${board.id}`);
  await page.getByTestId('board-name').click();
  const input = page.getByTestId('board-name-input');
  await input.fill('Nom abandonné');
  await input.press('Escape');

  await expect(page.getByTestId('board-name')).toHaveText(board.name);
  const persisted = await request.get(`/api/boards/${board.id}`);
  expect(((await persisted.json()) as { name: string }).name).toBe(board.name);
});

test('[F01-S3-AC3] keeps the previous name and sends no PATCH when the name is empty', async ({
  page,
  request,
}) => {
  const board = await createBoard(request, `Vide ${Date.now()}`);
  let patchCount = 0;
  await page.route(`**/api/boards/${board.id}`, async (route) => {
    if (route.request().method() === 'PATCH') {
      patchCount += 1;
    }
    await route.continue();
  });

  await page.goto(`/b/${board.id}`);
  await page.getByTestId('board-name').click();
  const input = page.getByTestId('board-name-input');
  await input.fill('   ');
  await input.press('Enter');

  await expect(page.getByTestId('board-name')).toHaveText(board.name);
  expect(patchCount).toBe(0);
});
