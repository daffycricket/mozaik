import { describe, expect, test } from 'vitest';
import { panViewport } from './viewport';

describe('[F02-S1-AC1] viewport pan', () => {
  test('[F02-S1-AC1] moves the world origin opposite to the screen drag at zoom 1', () => {
    const moved = panViewport({ x: 0, y: 0, zoom: 1 }, { x: 120, y: -40 });
    expect(moved).toEqual({ x: -120, y: 40, zoom: 1 });
  });

  test('[F02-S1-AC1] divides the screen delta by the zoom', () => {
    const moved = panViewport({ x: 10, y: 20, zoom: 2 }, { x: 100, y: 50 });
    expect(moved).toEqual({ x: -40, y: -5, zoom: 2 });
  });

  test('[F02-S1-AC1] keeps the zoom unchanged', () => {
    const moved = panViewport({ x: 0, y: 0, zoom: 3 }, { x: 0, y: 0 });
    expect(moved.zoom).toBe(3);
  });
});
