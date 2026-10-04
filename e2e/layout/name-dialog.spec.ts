import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { expectAbove, expectLeftOf } from '../support/layout';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1280, height: 800 } });

async function openNameDialog(page: Page, request: APIRequestContext): Promise<void> {
  const response = await request.post('/api/boards', { data: { name: 'Board UI-NAME' } });
  const board = (await response.json()) as { id: string };
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('name-dialog')).toBeVisible();
}

test('[UI-NAME-1] centers the dialog with the field focused and the actions in place', async ({
  page,
  request,
}) => {
  await openNameDialog(page, request);

  const dialog = page.getByTestId('name-dialog');
  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();
  if (viewport === null || box === null) {
    throw new Error('Expected the dialog and the viewport to have a size');
  }
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(4);
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(4);

  await expect(page.getByTestId('name-input')).toBeFocused();
  await expectLeftOf(page.getByTestId('name-back'), page.getByTestId('name-submit'));
  await expect(page.getByTestId('name-submit')).toHaveClass(/bg-primary/);
});

test('[UI-NAME-2] shows the error under the field in the destructive color', async ({
  page,
  request,
}) => {
  await openNameDialog(page, request);

  await page.getByTestId('name-submit').click();

  const input = page.getByTestId('name-input');
  const error = page.getByTestId('name-error');
  await expect(error).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(error).toHaveClass(/text-destructive/);
  await expectAbove(input, error);
});
