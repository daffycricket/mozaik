import { describe, expect, test } from 'vitest';
import {
  clampZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  screenToWorld,
  worldToScreen,
  zoomViewport,
} from './viewport';

describe('[F02-S2-AC1] viewport zoom', () => {
  test('[F02-S2-AC1] keeps the world point under the screen anchor fixed', () => {
    const viewport = { x: 40, y: -20, zoom: 1 };
    const anchor = { x: 300, y: 200 };
    const world = screenToWorld(viewport, anchor);

    const zoomed = zoomViewport(viewport, 2, anchor);

    expect(zoomed.zoom).toBe(2);
    expect(worldToScreen(zoomed, world).x).toBeCloseTo(anchor.x, 6);
    expect(worldToScreen(zoomed, world).y).toBeCloseTo(anchor.y, 6);
  });
});

describe('[F02-S2-AC2] viewport zoom bounds', () => {
  test('[F02-S2-AC2] clamps the zoom between 10 % and 400 %', () => {
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  test('[F02-S2-AC2] clamps an over-zoom and an under-zoom request', () => {
    const anchor = { x: 0, y: 0 };
    expect(zoomViewport({ x: 0, y: 0, zoom: 1 }, 8, anchor).zoom).toBe(MAX_ZOOM);
    expect(zoomViewport({ x: 0, y: 0, zoom: 1 }, 0.02, anchor).zoom).toBe(MIN_ZOOM);
  });
});
