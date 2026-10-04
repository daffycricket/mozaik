import { expect, test } from '@playwright/test';
import { expectCenteredH, expectCenteredV } from '../support/layout';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } });

test('[UI-ERR-1] centers the not found content horizontally and vertically', async ({ page }) => {
  await page.goto('/b/inexistant');

  const notFound = page.getByTestId('board-not-found');
  await expect(notFound).toBeVisible();
  await expectCenteredH(notFound, page.locator('body'));
  await expectCenteredV(notFound, page.locator('body'));

  await expectCenteredH(page.getByRole('heading', { name: 'Board introuvable' }), notFound);
  await expectCenteredH(page.getByText('existe pas ou a été supprimé'), notFound);
  await expectCenteredH(page.getByTestId('nav-boards'), notFound);
});

test.describe('at 1024x768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[UI-ERR-1] keeps the not found content centered at the small viewport', async ({
    page,
  }) => {
    await page.goto('/b/inexistant');

    const notFound = page.getByTestId('board-not-found');
    await expect(notFound).toBeVisible();
    await expectCenteredH(notFound, page.locator('body'));
    await expectCenteredV(notFound, page.locator('body'));
  });
});
