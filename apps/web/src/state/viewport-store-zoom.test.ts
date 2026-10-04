import { DEFAULT_VIEWPORT, MAX_ZOOM, screenToWorld, worldToScreen } from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { useViewportStore } from './viewport-store';

afterEach(() => {
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
});

describe('[F02-S2-AC1] viewport store zoom', () => {
  test('[F02-S2-AC1] zooms around the anchor screen point', () => {
    const anchor = { x: 200, y: 150 };
    const world = screenToWorld(useViewportStore.getState().viewport, anchor);

    useViewportStore.getState().zoomBy(2, anchor);

    const viewport = useViewportStore.getState().viewport;
    expect(viewport.zoom).toBe(2);
    expect(worldToScreen(viewport, world).x).toBeCloseTo(anchor.x, 6);
    expect(worldToScreen(viewport, world).y).toBeCloseTo(anchor.y, 6);
  });

  test('[F02-S2-AC2] keeps the zoom within the bounds', () => {
    useViewportStore.getState().zoomTo(100, { x: 0, y: 0 });
    expect(useViewportStore.getState().viewport.zoom).toBe(MAX_ZOOM);
  });

  test('[F02-S2-AC3] resets the zoom to 100 %', () => {
    useViewportStore.getState().zoomBy(2, { x: 0, y: 0 });
    useViewportStore.getState().zoomTo(1, { x: 0, y: 0 });
    expect(useViewportStore.getState().viewport.zoom).toBe(1);
  });
});
