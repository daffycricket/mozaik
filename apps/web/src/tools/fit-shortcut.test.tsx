// @vitest-environment happy-dom
import { createBoardDoc, createElement, DEFAULT_VIEWPORT, fitViewport } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useEditingStore } from '@/state/editing-store';
import { useViewportStore } from '@/state/viewport-store';
import { useFitShortcut } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CANVAS = { width: 800, height: 600 };

let doc: ReturnType<typeof createBoardDoc>;

function Probe() {
  useFitShortcut(doc);
  return <div data-testid="probe" />;
}

function press(init: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', shiftKey: true, ...init }));
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  doc = createBoardDoc();
  createElement(
    doc,
    { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
    { id: 's1', createdBy: 'u' },
  );
  useCanvasSizeStore.setState({ size: CANVAS });
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
  doc.destroy();
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
  useCanvasSizeStore.setState({ size: { width: 0, height: 0 } });
  useEditingStore.setState({ editingId: null });
});

describe('[F02-S4-AC1] fit shortcut', () => {
  test('[F02-S4-AC1] fits the viewport on the content with Shift+1', () => {
    press();

    expect(useViewportStore.getState().viewport).toEqual(
      fitViewport({ x: 0, y: 0, width: 100, height: 100 }, CANVAS),
    );
  });

  test('[F02-S4-AC1] recognizes the physical key through event.code', () => {
    press({ key: '&', shiftKey: true });

    expect(useViewportStore.getState().viewport).not.toEqual(DEFAULT_VIEWPORT);
  });

  test('[F02-S4-AC1] ignores the shortcut without Shift', () => {
    press({ shiftKey: false });

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });

  test('[F02-S4-AC1] ignores the shortcut with Ctrl or Alt', () => {
    press({ ctrlKey: true });
    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);

    press({ altKey: true });
    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });

  test('[F02-S4-AC1] ignores the shortcut while a text field has focus', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Digit1', shiftKey: true, bubbles: true }),
      );
    });

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
    input.remove();
  });
});

describe('[F02-S4-AC2] fit shortcut on an empty board', () => {
  test('[F02-S4-AC2] returns to the default viewport', () => {
    useViewportStore.getState().fitToContent({ x: 0, y: 0, width: 2000, height: 1000 }, CANVAS);
    expect(useViewportStore.getState().viewport).not.toEqual(DEFAULT_VIEWPORT);

    doc.destroy();
    doc = createBoardDoc();
    act(() => {
      root.render(<Probe />);
    });
    press();

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });
});
