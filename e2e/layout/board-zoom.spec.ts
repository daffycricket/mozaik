import { type APIRequestContext, expect, test } from '@playwright/test';
import { expectDistanceToEdge, expectNoOverlap, expectOrder } from '../support/layout';

async function createBoard(
  request: APIRequestContext,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post('/api/boards', { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: string; name: string };
}

const viewports = [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
];

for (const viewport of viewports) {
  test.describe(`board zoom controls at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('[UI-BOARD-5] floats the zoom controls at the bottom right, in order', async ({
      page,
      request,
    }) => {
      const board = await createBoard(request, `Zoom ${Date.now()}`);
      await page.goto(`/b/${board.id}`);

      const controls = page.getByTestId('zoom-controls');
      await expect(controls).toBeVisible();

      await expectDistanceToEdge(controls, 'right', 12);
      await expectDistanceToEdge(controls, 'bottom', 12);
      await expectOrder(
        [
          page.getByTestId('zoom-out'),
          page.getByTestId('zoom-level'),
          page.getByTestId('zoom-in'),
          page.getByTestId('zoom-fit'),
        ],
        'horizontal',
      );

      const fit = page.getByTestId('zoom-fit');
      await expect(fit).toHaveAttribute('aria-label', /Shift\+1/);
      await fit.hover();
      await expect(page.getByText('Recadrer sur tout le contenu (Shift+1)')).toBeVisible();
    });

    test('[UI-BOARD-6] keeps the floating elements from overlapping', async ({ page, request }) => {
      const board = await createBoard(request, `Overlap ${Date.now()}`);
      await page.goto(`/b/${board.id}`);

      await expectNoOverlap(page.getByTestId('toolbar'), page.getByTestId('zoom-controls'));
    });
  });
}
