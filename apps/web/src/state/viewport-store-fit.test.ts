import { DEFAULT_VIEWPORT, fitViewport } from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { useViewportStore } from './viewport-store';

afterEach(() => {
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
});

describe('[F02-S4-AC1] fit viewport store', () => {
  test('[F02-S4-AC1] writes the fitted viewport of a non-empty board', () => {
    const bounds = { x: 0, y: 0, width: 2000, height: 1000 };
    const canvas = { width: 800, height: 600 };

    useViewportStore.getState().fitToContent(bounds, canvas);

    expect(useViewportStore.getState().viewport).toEqual(fitViewport(bounds, canvas));
    expect(useViewportStore.getState().viewport.zoom).toBeLessThan(1);
  });

  test('[F02-S4-AC2] returns to the default viewport for an empty board', () => {
    useViewportStore.getState().fitToContent(null, { width: 800, height: 600 });

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });
});
