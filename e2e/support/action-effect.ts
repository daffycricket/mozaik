import type { Page } from '@playwright/test';

export type Position = { x: number; y: number };

type MeasurementWindow = {
  eval: (source: string) => unknown;
  performance: { now: () => number };
};

/**
 * Measures, on the clock of an observer page, the delay between an action and
 * its visible effect, locally (FL-1) or at a second user (FL-4). The effect is
 * dated at the first animation frame where the in-page predicate becomes true,
 * so the measurement never includes the polling step of the test's wait
 * (B-004-AC1, ADR-0015).
 */
export async function measureActionToEffect<Arg = void>(
  page: Page,
  action: () => Promise<void>,
  effect: (arg: Arg) => boolean,
  arg?: Arg,
): Promise<number> {
  const start = await page.evaluate(() => {
    const browser = globalThis as unknown as MeasurementWindow;
    return browser.performance.now();
  });
  await action();
  const handle = await page.waitForFunction(
    (data: { source: string; argument: unknown }) => {
      const browser = globalThis as unknown as MeasurementWindow;
      const predicate = browser.eval(`(${data.source})`) as (value: unknown) => boolean;
      if (predicate(data.argument)) {
        return browser.performance.now();
      }
      return false;
    },
    { source: effect.toString(), argument: arg },
  );
  const end = (await handle.jsonValue()) as number;
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
