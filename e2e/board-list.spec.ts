import { type APIRequestContext, expect, test } from '@playwright/test';

const EMPTY_STORAGE = { cookies: [], origins: [] };

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

function isoFromNow(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

test('[F01-S2-AC1] lists boards from the most recently modified to the oldest', async ({
  page,
}) => {
  const boards = [
    {
      id: 'board-recent',
      name: 'Rétro S12',
      createdAt: isoFromNow(-2.5 * 3_600_000),
      updatedAt: isoFromNow(-2.5 * 3_600_000),
    },
    {
      id: 'board-yesterday',
      name: 'Atelier vision',
      createdAt: isoFromNow(-24 * 3_600_000),
      updatedAt: isoFromNow(-24 * 3_600_000),
    },
    {
      id: 'board-old',
      name: 'Board sans titre',
      createdAt: isoFromNow(-6 * 24 * 3_600_000),
      updatedAt: isoFromNow(-6 * 24 * 3_600_000),
    },
  ];
  await page.route('**/api/boards', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: boards });
      return;
    }
    await route.continue();
  });

  await page.goto('/');

  const rows = page.getByTestId('board-item');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Rétro S12');
  await expect(rows.nth(1)).toContainText('Atelier vision');
  await expect(rows.nth(2)).toContainText('Board sans titre');
  await expect(rows.nth(0)).toContainText('il y a 2 h');
  await expect(rows.nth(1)).toContainText('hier');
  await expect(rows.nth(2)).toContainText(/le \d{2}\/\d{2}/);
});

test('[F01-S2-AC2] invites to create a first board when the list is empty', async ({ page }) => {
  await page.route('**/api/boards', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [] });
      return;
    }
    await route.continue();
  });

  await page.goto('/');

  await expect(page.getByTestId('board-empty')).toBeVisible();
  await expect(page.getByTestId('board-empty')).toContainText("Aucun board pour l'instant.");
  await expect(page.getByTestId('board-empty-create')).toBeVisible();
});

test('[F01-S2-AC3] opens a board from the list and shows its content', async ({
  page,
  request,
}) => {
  const name = `Ouvrir ${Date.now()}`;
  const board = await createBoard(request, name);

  await page.goto('/');
  const row = page.getByTestId('board-item').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole('link').click();

  await expect(page).toHaveURL(new RegExp(`/b/${board.id}$`));
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('board-name')).toHaveText(name);
});

test('[F01-S2-AC4] returns to the menu with the header link and the browser back button', async ({
  page,
  request,
}) => {
  const name = `Retour ${Date.now()}`;
  const board = await createBoard(request, name);

  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();

  await page.getByTestId('nav-boards').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('board-create')).toBeVisible();

  await page.getByTestId('board-item').filter({ hasText: name }).getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/b/${board.id}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('board-create')).toBeVisible();
});

test.describe('anonymous visitor', () => {
  test.use({ storageState: EMPTY_STORAGE });

  test('[F01-S2-AC5] opens a shared board URL after entering the name', async ({
    page,
    request,
  }) => {
    const board = await createBoard(request, `Partagé ${Date.now()}`);

    await page.goto(`/b/${board.id}`);
    await expect(page.getByTestId('name-dialog')).toBeVisible();
    await expect(page.getByTestId('board-canvas')).toHaveCount(0);

    await page.getByTestId('name-input').fill('Lama Flamboyant');
    await page.getByTestId('name-input').press('Enter');

    await expect(page).toHaveURL(new RegExp(`/b/${board.id}$`));
    await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
    await expect(page.getByTestId('name-dialog')).toHaveCount(0);
  });
});
