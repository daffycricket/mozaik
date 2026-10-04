import { type APIRequestContext, expect, test } from '@playwright/test';
import { storedIdentityState } from '../support/identity';
import { expectCenteredH, expectCenteredV } from '../support/layout';

test.use({ viewport: { width: 1280, height: 800 } });

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

test('[UI-MENU-6] opens a centered modal dialog focused on cancel, and Escape cancels', async ({
  page,
  request,
}) => {
  const name = `UI suppr ${Date.now()}`;
  await createBoard(request, name);

  await page.goto('/');
  await page
    .getByTestId('board-item')
    .filter({ hasText: name })
    .getByTestId('board-delete')
    .click();

  const dialog = page.getByTestId('delete-dialog');
  await expect(dialog).toBeVisible();
  await expectCenteredH(dialog, page.locator('body'));
  await expectCenteredV(dialog, page.locator('body'));

  const overlay = page.locator('[data-slot="alert-dialog-overlay"]');
  await expect(overlay).toBeVisible();
  const overlayBox = await overlay.boundingBox();
  const viewport = page.viewportSize();
  if (overlayBox === null || viewport === null) {
    throw new Error('Expected the overlay and the viewport to have a box');
  }
  expect(overlayBox.width).toBeGreaterThanOrEqual(viewport.width - 1);
  expect(overlayBox.height).toBeGreaterThanOrEqual(viewport.height - 1);

  await expect(page.getByTestId('delete-cancel')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('board-item').filter({ hasText: name })).toBeVisible();
});

test('[UI-ERR-2] shows the deleted message as a modal that blocks the board behind', async ({
  browser,
  request,
}) => {
  const name = `UI supprimé ${Date.now()}`;
  const board = await createBoard(request, name);

  const contextA = await browser.newContext({ storageState: storedIdentityState() });
  const pageA = await contextA.newPage();
  await pageA.goto(`/b/${board.id}`);
  await expect(pageA.getByTestId('board-canvas').locator('canvas')).toBeVisible();

  const contextB = await browser.newContext({ storageState: storedIdentityState() });
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await pageB
    .getByTestId('board-item')
    .filter({ hasText: name })
    .getByTestId('board-delete')
    .click();
  await pageB.getByTestId('delete-confirm').click();

  const deleted = pageA.getByTestId('board-deleted');
  await expect(deleted).toBeVisible();
  await expect(deleted).toHaveAttribute('role', 'alertdialog');

  const overlay = pageA.locator('[data-slot="alert-dialog-overlay"]');
  await expect(overlay).toBeVisible();

  const nameBox = await pageA.getByTestId('board-name').boundingBox();
  if (nameBox === null) {
    throw new Error('Expected the board name to have a box');
  }
  await pageA.mouse.click(nameBox.x + nameBox.width / 2, nameBox.y + nameBox.height / 2);
  await expect(pageA.getByTestId('board-name-input')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});
