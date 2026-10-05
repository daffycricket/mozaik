export type FrameStats = {
  medianMs: number;
  maxMs: number;
  count: number;
};

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
export function frameStats(intervals: number[]): FrameStats {
  return {
    medianMs: median(intervals),
    maxMs: maximum(intervals),
    count: intervals.length,
  };
}

/**
 * Aggregates the frame intervals of several runs the way F00 prescribes: each
 * run yields a median and a maximum, and the reported values are the medians of
 * the runs, so a single machine hiccup does not fail the requirement.
 */
export function frameStatsPerRun(runs: number[][]): FrameStats {
  const stats = runs.map((run) => frameStats(run));
  return {
    medianMs: median(stats.map((stat) => stat.medianMs)),
    maxMs: median(stats.map((stat) => stat.maxMs)),
    count: stats.reduce((total, stat) => total + stat.count, 0),
  };
}

/**
 * Returns the median of the maxima of several runs, the aggregation F00
 * prescribes for the "no value above the threshold" measures.
 */
export function medianOfMaxima(runs: number[][]): number {
  return median(runs.map((run) => maximum(run)));
}
