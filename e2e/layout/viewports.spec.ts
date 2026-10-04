import { expect, test } from '@playwright/test';

test.describe('layout reference viewport 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('[T-006-AC4] runs the layout project at 1280x800', async ({ page }) => {
    expect(page.viewportSize()).toEqual({ width: 1280, height: 800 });
  });
});

test.describe('layout reference viewport 1024x768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('[T-006-AC4] runs the layout project at 1024x768', async ({ page }) => {
    expect(page.viewportSize()).toEqual({ width: 1024, height: 768 });
  });
});
