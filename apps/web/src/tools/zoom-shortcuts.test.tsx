// @vitest-environment happy-dom
import { DEFAULT_VIEWPORT, ZOOM_STEP } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';
import { useZoomShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  useZoomShortcuts();
  return <div data-testid="probe" />;
}

function press(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, ...init }));
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  useCanvasSizeStore.setState({ size: { width: 800, height: 600 } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Probe />);
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

describe('[F02-S2-AC3] zoom shortcuts', () => {
  test('[F02-S2-AC3] zooms in with Ctrl+= and out with Ctrl+-', () => {
    press('=');
    expect(useViewportStore.getState().viewport.zoom).toBeCloseTo(ZOOM_STEP, 6);

    press('-');
    expect(useViewportStore.getState().viewport.zoom).toBeCloseTo(1, 6);
  });

  test('[F02-S2-AC3] resets the zoom to 100 % with Ctrl+0', () => {
    press('=');
    press('=');
    press('0');
    expect(useViewportStore.getState().viewport.zoom).toBe(1);
  });

  test('[F02-S2-AC3] ignores the shortcuts without Ctrl or Cmd', () => {
    press('=', { ctrlKey: false });
    expect(useViewportStore.getState().viewport.zoom).toBe(1);
  });
});
