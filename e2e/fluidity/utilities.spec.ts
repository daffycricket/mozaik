import { expect, test } from '@playwright/test';
import { countIntermediatePositions, measureActionToEffect } from '../support/action-effect';
import {
  frameStats,
  installProbe,
  readFrameIntervals,
  readLongTasks,
  resetProbe,
} from '../support/probe';
import { addWebSocketLatency } from '../support/websocket-latency';

type RemoteWindow = {
  BroadcastChannel: new (
    name: string,
  ) => {
    postMessage: (message: unknown) => void;
    onmessage: ((event: unknown) => void) | null;
  };
  __remote?: boolean;
};

test('[T-004-AC1] measures frame intervals and extracts the median and the maximum', async ({
  page,
}) => {
  await installProbe(page);
  await page.goto('/');
  await resetProbe(page);

  await page.evaluate(async () => {
    const browser = globalThis as unknown as {
      requestAnimationFrame: (callback: (time: number) => void) => number;
    };
    await new Promise<void>((resolve) => {
      const start = Date.now();
      const step = (): void => {
        if (Date.now() - start >= 400) {
          resolve();
          return;
        }
        browser.requestAnimationFrame(step);
      };
      browser.requestAnimationFrame(step);
    });
  });

  const stats = frameStats(await readFrameIntervals(page));
  expect(stats.count).toBeGreaterThan(5);
  expect(stats.medianMs).toBeGreaterThan(0);
  expect(stats.medianMs).toBeLessThanOrEqual(50);
  expect(stats.maxMs).toBeGreaterThanOrEqual(stats.medianMs);
});

test('[T-004-AC2] collects long tasks during a scenario', async ({ page }) => {
  await installProbe(page);
  await page.goto('/');

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          const start = Date.now();
          while (Date.now() - start < 250) {
            // Busy-wait inside a task so the browser reports a long task.
          }
          resolve();
        }, 0);
      }),
  );

  await expect
    .poll(async () => Math.max(0, ...(await readLongTasks(page))))
    .toBeGreaterThanOrEqual(200);
});

test('[T-004-AC3] adds latency to websocket messages in both directions', async ({ page }) => {
  const stats = await addWebSocketLatency(page, 300);

  await page.goto('/');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/boards') && response.request().method() === 'POST',
  );
  await page.getByTestId('board-create').click();
  await created;
  await expect(page).toHaveURL(/\/b\/[^/]+$/);

  await expect.poll(() => stats.clientToServer).toBeGreaterThan(0);
  await expect.poll(() => stats.serverToClient).toBeGreaterThan(0);
});

test('[T-004-AC4] measures action-to-effect delays locally and for a second user', async ({
  browser,
  page,
}) => {
  await page.goto('/');
  const localDelay = await measureActionToEffect(
    page,
    () => page.getByTestId('board-create').click(),
    () => expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible(),
  );
  expect(localDelay).toBeLessThan(3000);

  const context = await browser.newContext();
  await context.route('**/*', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>remote</title>' }),
  );
  const pageA = await context.newPage();
  const pageB = await context.newPage();
  await pageA.goto('http://fluidity.test/');
  await pageB.goto('http://fluidity.test/');

  await pageB.evaluate(() => {
    const browserGlobal = globalThis as unknown as RemoteWindow;
    const channel = new browserGlobal.BroadcastChannel('fluidity-remote');
    channel.onmessage = () => {
      browserGlobal.__remote = true;
    };
  });

  const remoteDelay = await measureActionToEffect(
    pageB,
    async () => {
      await pageA.evaluate(() => {
        const browserGlobal = globalThis as unknown as RemoteWindow;
        const channel = new browserGlobal.BroadcastChannel('fluidity-remote');
        setTimeout(() => {
          channel.postMessage('go');
        }, 100);
      });
    },
    () =>
      expect
        .poll(() => pageB.evaluate(() => Boolean((globalThis as unknown as RemoteWindow).__remote)))
        .toBe(true),
  );
  expect(remoteDelay).toBeGreaterThanOrEqual(100);
  expect(remoteDelay).toBeLessThan(2000);

  expect(
    countIntermediatePositions([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ]),
  ).toBe(4);

  await context.close();
});
