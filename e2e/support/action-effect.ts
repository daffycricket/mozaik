import type { Page } from '@playwright/test';

export type Position = { x: number; y: number };

/**
 * Measures, on the clock of an observer page, the delay between an action and
 * its visible effect, locally (FL-1) or at a second user (FL-4).
 */
export async function measureActionToEffect(
  page: Page,
  action: () => Promise<void>,
  effect: () => Promise<void>,
): Promise<number> {
  const start = await page.evaluate(() => {
    const browser = globalThis as unknown as { performance: { now: () => number } };
    return browser.performance.now();
  });
  await action();
  await effect();
  const end = await page.evaluate(() => {
    const browser = globalThis as unknown as { performance: { now: () => number } };
    return browser.performance.now();
  });
  return end - start;
}

/**
 * Counts the distinct positions received, ignoring consecutive duplicates (FL-4).
 */
export function countIntermediatePositions(positions: Position[]): number {
  let count = 0;
  let previous: Position | undefined;
  for (const position of positions) {
    if (previous === undefined || position.x !== previous.x || position.y !== previous.y) {
      count += 1;
      previous = position;
    }
  }
  return count;
}
