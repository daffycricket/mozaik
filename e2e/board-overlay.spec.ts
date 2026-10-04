import { expect, type Page, test } from '@playwright/test';

type OverlayBoxes = {
  selection: { x: number; y: number; width: number; height: number } | null;
  handles: Array<{ x: number; y: number; width: number; height: number }>;
  cursors: Array<{ x: number; y: number }>;
};

type BoardApi = {
  getOverlayBoxes: () => OverlayBoxes;
};

async function openNewBoard(page: Page): Promise<void> {
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.goto('/');
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);
}

test('[T-006-AC6] exposes the overlay boxes of the selection and remote cursors', async ({
  page,
}) => {
  await openNewBoard(page);

  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as { __board?: BoardApi }).__board?.getOverlayBoxes() != null,
      ),
    )
    .toBe(true);

  const boxes = await page.evaluate(() =>
    (globalThis as { __board?: BoardApi }).__board?.getOverlayBoxes(),
  );

  expect(boxes).toEqual({ selection: null, handles: [], cursors: [] });
});
