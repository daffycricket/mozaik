import { expect, test } from '@playwright/test';

test('[F01-S1-AC1] creates a board from the home page and opens it', async ({ page }) => {
  await page.goto('/');

  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.getByTestId('board-create').click();
  const response = await created;

  expect(response.status()).toBe(201);
  const board = (await response.json()) as { id: string; name: string };
  expect(board.name).toBe('Board sans titre');
  await expect(page).toHaveURL(new RegExp(`/b/${board.id}$`));
  await expect(page.getByTestId('board-canvas')).toBeAttached();
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
});
