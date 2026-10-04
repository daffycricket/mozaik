import { DEFAULT_VIEWPORT } from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { useViewportStore } from './viewport-store';

afterEach(() => {
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
});

describe('[F02-S1-AC1] viewport store', () => {
  test('[F02-S1-AC1] moves the viewport opposite to the screen drag', () => {
    useViewportStore.getState().panByScreen({ x: 100, y: -50 });
    expect(useViewportStore.getState().viewport).toEqual({ x: -100, y: 50, zoom: 1 });
  });

  test('[F02-S1-AC1] resets to the default viewport', () => {
    useViewportStore.getState().panByScreen({ x: 10, y: 10 });
    useViewportStore.getState().resetViewport();
    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });
});
