import { type APIRequestContext, expect, test } from '@playwright/test';
import { expectCenteredH, expectLeftOf, expectOrder } from '../support/layout';

test.use({ viewport: { width: 1280, height: 800 } });

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

test('[UI-MENU-1] places the header full width with the title left and the create button right', async ({
  page,
}) => {
  await page.goto('/');

  const header = page.locator('header');
  const title = page.getByRole('heading', { name: 'Boards' });
  const create = page.getByTestId('board-create');
  await expect(header).toBeVisible();
  await expectLeftOf(title, create);

  const box = await header.boundingBox();
  const viewport = page.viewportSize();
  if (box === null || viewport === null) {
    throw new Error('Expected the header and the viewport to have a box');
  }
  expect(box.x).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
});

test('[UI-MENU-2] centers the list, caps its width and separates rows with a border', async ({
  page,
  request,
}) => {
  await createBoard(request, `Menu A ${Date.now()}`);
  await createBoard(request, `Menu B ${Date.now()}`);

  await page.goto('/');
  const list = page.getByTestId('board-list');
  await expect(list).toBeVisible();
  await expectCenteredH(list, page.locator('main'));

  const box = await list.boundingBox();
  if (box === null) {
    throw new Error('Expected the list to have a box');
  }
  expect(box.width).toBeLessThanOrEqual(721);

  const rows = page.getByTestId('board-item');
  await expectOrder([rows.nth(0), rows.nth(1)], 'vertical');
  const [bottom, top] = await Promise.all([
    rows.nth(0).evaluate((element) => {
      const browser = globalThis as unknown as {
        getComputedStyle: (target: unknown) => { getPropertyValue: (name: string) => string };
      };
      return browser.getComputedStyle(element).getPropertyValue('border-bottom-width');
    }),
    rows.nth(1).evaluate((element) => {
      const browser = globalThis as unknown as {
        getComputedStyle: (target: unknown) => { getPropertyValue: (name: string) => string };
      };
      return browser.getComputedStyle(element).getPropertyValue('border-top-width');
    }),
  ]);
  expect(Math.max(Number.parseFloat(bottom), Number.parseFloat(top))).toBeGreaterThan(0);
});

test('[UI-MENU-3] lays out the name, the date and the delete button from left to right', async ({
  page,
  request,
}) => {
  const name = `Ligne ${Date.now()}`;
  const board = await createBoard(request, name);

  await page.goto('/');
  const row = page.getByTestId('board-item').filter({ hasText: name });
  await expect(row).toBeVisible();

  await expectLeftOf(row.getByText(name, { exact: true }), row.getByText(/modifié/));
  await expectLeftOf(row.getByText(/modifié/), row.getByTestId('board-delete'));

  await row.getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/b/${board.id}$`));
});

test('[UI-MENU-4] centers the empty state message and create button', async ({ page }) => {
  await page.route('**/api/boards', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [] });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  const empty = page.getByTestId('board-empty');
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("Aucun board pour l'instant.");
  await expectCenteredH(empty, page.locator('main'));
  await expect(empty.getByTestId('board-empty-create')).toBeVisible();
});

test('[UI-MENU-5] reaches the rows with Tab in display order and opens with Enter', async ({
  page,
  request,
}) => {
  await createBoard(request, `Tab A ${Date.now()}`);
  await createBoard(request, `Tab B ${Date.now()}`);

  await page.goto('/');
  const rows = page.getByTestId('board-item');
  await expect(rows.first()).toBeVisible();
  const links = rows.getByRole('link');

  await page.getByTestId('board-create').focus();
  await page.keyboard.press('Tab');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
});

test('[UI-BOARD-1] places the boards link and the board name on the left of the header', async ({
  page,
  request,
}) => {
  const name = `En-tête ${Date.now()}`;
  const board = await createBoard(request, name);

  await page.goto(`/b/${board.id}`);
  const header = page.getByTestId('board-header');
  await expect(header).toBeVisible();
  await expect(page.getByTestId('board-name')).toHaveText(name);
  await expectLeftOf(page.getByTestId('nav-boards'), page.getByTestId('board-name'));

  const box = await header.boundingBox();
  const viewport = page.viewportSize();
  if (box === null || viewport === null) {
    throw new Error('Expected the header and the viewport to have a box');
  }
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
});

test.describe('at 1024x768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[UI-MENU-1] keeps the header full width at the small reference viewport', async ({
    page,
  }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expectLeftOf(
      page.getByRole('heading', { name: 'Boards' }),
      page.getByTestId('board-create'),
    );

    const box = await header.boundingBox();
    const viewport = page.viewportSize();
    if (box === null || viewport === null) {
      throw new Error('Expected the header and the viewport to have a box');
    }
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
  });
});
