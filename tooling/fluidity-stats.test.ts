import { describe, expect, test } from 'vitest';
import { frameStatsPerRun, medianOfMaxima } from './fluidity-stats';

describe('[B-001-AC1] frame interval aggregation over three runs', () => {
  test('[B-001-AC1] absorbs the spike of a single unstable run among three', () => {
    const stats = frameStatsPerRun([
      [16, 16, 16],
      [16, 400, 16],
      [16, 16, 16],
    ]);

    expect(stats.medianMs).toBe(16);
    expect(stats.maxMs).toBe(16);
    expect(stats.count).toBe(9);
  });

  test('[B-001-AC1] still fails when the jank affects two runs out of three', () => {
    const stats = frameStatsPerRun([
      [16, 400],
      [16, 400],
      [16, 16],
    ]);

    expect(stats.maxMs).toBe(400);
  });

  test('[B-001-AC1] keeps the median interval of every run under control', () => {
    const stats = frameStatsPerRun([
      [40, 40],
      [40, 40],
      [16, 16],
    ]);

    expect(stats.medianMs).toBe(40);
  });

  test('[B-001-AC1] absorbs an isolated long task spike among three runs', () => {
    expect(medianOfMaxima([[0], [250], [0]])).toBe(0);
    expect(medianOfMaxima([[250], [250], [0]])).toBe(250);
  });
});

describe('[B-002-AC1] zoom frame interval aggregation over three runs', () => {
  test('[B-002-AC1] absorbs the spike of a single unstable zoom run among three', () => {
    const stats = frameStatsPerRun([
      [16, 16, 16],
      [16, 547, 16],
      [16, 16, 16],
    ]);

    expect(stats.medianMs).toBe(16);
    expect(stats.maxMs).toBe(16);
    expect(stats.count).toBe(9);
  });

  test('[B-002-AC1] still fails when the jank affects two zoom runs out of three', () => {
    const stats = frameStatsPerRun([
      [16, 547],
      [16, 547],
      [16, 16],
    ]);

    expect(stats.maxMs).toBe(547);
  });

  test('[B-002-AC1] absorbs an isolated long task spike among three zoom runs', () => {
    expect(medianOfMaxima([[0], [547], [0]])).toBe(0);
    expect(medianOfMaxima([[547], [547], [0]])).toBe(547);
  });
});
