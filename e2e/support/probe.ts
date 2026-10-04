import type { Page } from '@playwright/test';

export type ProbeState = {
  frames: number[];
  longTasks: number[];
};

type ProbeWindow = {
  __probe?: ProbeState;
  requestAnimationFrame: (callback: (time: number) => void) => number;
  performance: { now: () => number };
  PerformanceObserver?: new (
    callback: (list: LongTaskList) => void,
  ) => {
    observe: (options: { entryTypes: string[] }) => void;
  };
};

type LongTaskList = {
  getEntries: () => Array<{ duration: number }>;
};

/**
 * Installs the frame and long-task recorders before the page loads.
 */
export async function installProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const browser = globalThis as unknown as ProbeWindow;
    const state: ProbeState = { frames: [], longTasks: [] };
    browser.__probe = state;

    const recordFrame = (): void => {
      state.frames.push(browser.performance.now());
      browser.requestAnimationFrame(recordFrame);
    };
    browser.requestAnimationFrame(recordFrame);

    try {
      if (typeof browser.PerformanceObserver === 'function') {
        const observer = new browser.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            state.longTasks.push(entry.duration);
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      // The longtask entry type is not supported by this browser.
    }
  });
}

/**
 * Clears the recorded frames and long tasks of the current page.
 */
export async function resetProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const browser = globalThis as unknown as ProbeWindow;
    if (browser.__probe !== undefined) {
      browser.__probe.frames = [];
      browser.__probe.longTasks = [];
    }
  });
}

/**
 * Reads the intervals between the recorded animation frames.
 */
export async function readFrameIntervals(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const browser = globalThis as unknown as ProbeWindow;
    const frames = browser.__probe?.frames ?? [];
    const intervals: number[] = [];
    for (let index = 1; index < frames.length; index += 1) {
      const previous = frames[index - 1];
      const current = frames[index];
      if (previous !== undefined && current !== undefined) {
        intervals.push(current - previous);
      }
    }
    return intervals;
  });
}

/**
 * Reads the durations of the long tasks recorded so far.
 */
export async function readLongTasks(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const browser = globalThis as unknown as ProbeWindow;
    return [...(browser.__probe?.longTasks ?? [])];
  });
}

/**
 * Returns the median of a list of numbers (0 when the list is empty).
 */
export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? 0;
  }
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return (low + high) / 2;
}

/**
 * Returns the largest value of a list (0 when the list is empty).
 */
export function maximum(values: number[]): number {
  return values.reduce((max, value) => (value > max ? value : max), 0);
}

/**
 * Extracts the median and maximum interval from frame intervals (FL-2).
 */
export function frameStats(intervals: number[]): {
  medianMs: number;
  maxMs: number;
  count: number;
} {
  return {
    medianMs: median(intervals),
    maxMs: maximum(intervals),
    count: intervals.length,
  };
}
