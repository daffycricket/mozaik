import { type APIRequestContext, expect, test } from '@playwright/test';
import { expectCenteredV, expectDistanceToEdge, expectOrder } from '../support/layout';

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
  test.describe(`board toolbar at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('[UI-BOARD-2] fills the space under the header without a page scrollbar', async ({
      page,
      request,
    }) => {
      const board = await createBoard(request, `Canvas ${Date.now()}`);
      await page.goto(`/b/${board.id}`);

      const canvas = page.getByTestId('board-canvas');
      await expect(canvas).toBeVisible();
      const box = await canvas.boundingBox();
      if (box === null) {
        throw new Error('Expected the canvas to have a bounding box');
      }

      expect(box.x).toBeCloseTo(0, 0);
      expect(box.y).toBeCloseTo(48, 0);
      expect(box.width).toBeCloseTo(viewport.width, 0);
      expect(box.height).toBeCloseTo(viewport.height - 48, 0);

      const scrolls = await page.evaluate(() => {
        const browser = globalThis as unknown as {
          innerHeight: number;
          innerWidth: number;
          document: { documentElement: { scrollHeight: number; scrollWidth: number } };
        };
        return (
          browser.document.documentElement.scrollHeight > browser.innerHeight ||
          browser.document.documentElement.scrollWidth > browser.innerWidth
        );
      });
      expect(scrolls).toBe(false);
    });

    test('[UI-BOARD-3] floats the toolbar on the left, vertically centered, tools in order', async ({
      page,
      request,
    }) => {
      const board = await createBoard(request, `Toolbar ${Date.now()}`);
      await page.goto(`/b/${board.id}`);

      const toolbar = page.getByTestId('toolbar');
      await expect(toolbar).toBeVisible();

      await expectDistanceToEdge(toolbar, 'left', 12);
      await expectCenteredV(toolbar, page.getByTestId('board-canvas'));
      await expectOrder(
        [page.getByTestId('tool-select'), page.getByTestId('tool-hand')],
        'vertical',
      );
    });

    test('[UI-BOARD-4] highlights the active tool with aria-pressed', async ({ page, request }) => {
      const board = await createBoard(request, `Active ${Date.now()}`);
      await page.goto(`/b/${board.id}`);

      const select = page.getByTestId('tool-select');
      const hand = page.getByTestId('tool-hand');
      await expect(select).toHaveAttribute('aria-pressed', 'true');
      await expect(hand).toHaveAttribute('aria-pressed', 'false');

      await hand.click();
      await expect(hand).toHaveAttribute('aria-pressed', 'true');
      await expect(select).toHaveAttribute('aria-pressed', 'false');

      const backgrounds = await page.evaluate(() => {
        const browser = globalThis as unknown as {
          document: { querySelector: (selector: string) => unknown };
          getComputedStyle: (element: unknown) => { backgroundColor: string };
        };
        const active = browser.document.querySelector('[data-testid="tool-hand"]');
        const inactive = browser.document.querySelector('[data-testid="tool-select"]');
        return {
          active: active === null ? '' : browser.getComputedStyle(active).backgroundColor,
          inactive: inactive === null ? '' : browser.getComputedStyle(inactive).backgroundColor,
        };
      });
      expect(backgrounds.active).not.toBe(backgrounds.inactive);
    });
  });
}
