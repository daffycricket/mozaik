import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('[F01-S5-AC1] shows a not found page without asking for a name or opening a socket', async ({
  page,
}) => {
  const sockets: string[] = [];
  page.on('websocket', (socket) => {
    sockets.push(socket.url());
  });

  await page.goto('/b/inexistant');

  const notFound = page.getByTestId('board-not-found');
  await expect(notFound).toBeVisible();
  await expect(notFound).toContainText('Board introuvable');
  await expect(notFound).toContainText('existe pas ou a été supprimé');
  await expect(page.getByTestId('name-dialog')).toHaveCount(0);
  await expect(page.getByTestId('board-canvas')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (globalThis as { __board?: unknown }).__board !== undefined))
    .toBe(false);
  expect(sockets.some((url) => url.includes('/collab'))).toBe(false);

  await notFound.getByTestId('nav-boards').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('board-create')).toBeVisible();
});
