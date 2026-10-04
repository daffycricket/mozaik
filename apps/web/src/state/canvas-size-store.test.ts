import { beforeEach, describe, expect, test } from 'vitest';
import { useCanvasSizeStore } from './canvas-size-store';

beforeEach(() => {
  useCanvasSizeStore.setState({ size: { width: 0, height: 0 } });
});

describe('canvas size store', () => {
  test('stores the canvas size', () => {
    useCanvasSizeStore.getState().setSize({ width: 800, height: 600 });
    expect(useCanvasSizeStore.getState().size).toEqual({ width: 800, height: 600 });
  });

  test('keeps the previous state when the size is unchanged', () => {
    useCanvasSizeStore.getState().setSize({ width: 800, height: 600 });
    const previous = useCanvasSizeStore.getState().size;
    useCanvasSizeStore.getState().setSize({ width: 800, height: 600 });
    expect(useCanvasSizeStore.getState().size).toBe(previous);
  });
});
