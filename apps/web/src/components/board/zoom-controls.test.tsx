// @vitest-environment happy-dom
import { DEFAULT_VIEWPORT, ZOOM_STEP } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';
import { ZoomControls } from './zoom-controls';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  useCanvasSizeStore.setState({ size: { width: 800, height: 600 } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ZoomControls />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
  useCanvasSizeStore.setState({ size: { width: 0, height: 0 } });
});

function item(testId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

describe('[UI-BOARD-5] zoom controls', () => {
  test('[UI-BOARD-5] orders zoom out, percentage and zoom in', () => {
    const out = item('zoom-out');
    const level = item('zoom-level');
    const zoomIn = item('zoom-in');
    expect(out).not.toBeNull();
    expect(level).not.toBeNull();
    expect(zoomIn).not.toBeNull();
    expect(out?.compareDocumentPosition(level as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(level?.compareDocumentPosition(zoomIn as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(level?.textContent).toBe('100 %');
  });
});

describe('[F02-S2-AC3] zoom controls behaviour', () => {
  test('[F02-S2-AC3] zooms in and updates the percentage', () => {
    act(() => {
      item('zoom-in')?.click();
    });
    expect(useViewportStore.getState().viewport.zoom).toBeCloseTo(ZOOM_STEP, 6);
    expect(item('zoom-level')?.textContent).toBe('120 %');
  });

  test('[F02-S2-AC3] zooms out and updates the percentage', () => {
    act(() => {
      item('zoom-out')?.click();
    });
    expect(useViewportStore.getState().viewport.zoom).toBeCloseTo(1 / ZOOM_STEP, 6);
    expect(item('zoom-level')?.textContent).toBe('83 %');
  });
});
