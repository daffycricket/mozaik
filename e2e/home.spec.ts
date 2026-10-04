import { expect, test } from '@playwright/test';

test('[T-002-AC2] loads the home page of the application', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible();
});
