import { describe, expect, test } from 'vitest';
import { DEFAULT_VIEWPORT, screenToWorld, worldToScreen } from './viewport';

describe('[T-003-AC4] viewport conversions', () => {
  test('[T-003-AC4] maps world to screen and back with the default viewport', () => {
    const point = { x: 120, y: 45 };
    expect(worldToScreen(DEFAULT_VIEWPORT, point)).toEqual(point);
    expect(screenToWorld(DEFAULT_VIEWPORT, point)).toEqual(point);
  });

  test('[T-003-AC4] applies the pan and zoom of the viewport', () => {
    const viewport = { x: 100, y: 50, zoom: 2 };
    expect(worldToScreen(viewport, { x: 100, y: 50 })).toEqual({ x: 0, y: 0 });
    expect(worldToScreen(viewport, { x: 150, y: 75 })).toEqual({ x: 100, y: 50 });
    expect(screenToWorld(viewport, { x: 100, y: 50 })).toEqual({ x: 150, y: 75 });
  });
});
