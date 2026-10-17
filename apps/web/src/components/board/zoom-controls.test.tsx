// @vitest-environment happy-dom
import {
  type BoardDoc,
  createBoardDoc,
  createElement,
  DEFAULT_VIEWPORT,
  fitViewport,
  ZOOM_STEP,
} from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BoardDocContext } from '@/collab/board-doc-context';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';
import { ZoomControls } from './zoom-controls';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CANVAS = { width: 800, height: 600 };

let container: HTMLDivElement;
let root: Root;
const docs: BoardDoc[] = [];

beforeEach(() => {
  useCanvasSizeStore.setState({ size: CANVAS });
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
  for (const doc of docs) {
    doc.destroy();
  }
  docs.length = 0;
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
  useCanvasSizeStore.setState({ size: { width: 0, height: 0 } });
});

function item(testId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function renderWithDoc(doc: BoardDoc): void {
  docs.push(doc);
  act(() => {
    root.render(
      <BoardDocContext.Provider value={doc}>
        <ZoomControls />
      </BoardDocContext.Provider>,
    );
  });
}

describe('[UI-BOARD-5] zoom controls', () => {
  test('[UI-BOARD-5] orders zoom out, percentage, zoom in and fit content', () => {
    const out = item('zoom-out');
    const level = item('zoom-level');
    const zoomIn = item('zoom-in');
    const zoomFit = item('zoom-fit');
    expect(out).not.toBeNull();
    expect(level).not.toBeNull();
    expect(zoomIn).not.toBeNull();
    expect(zoomFit).not.toBeNull();
    expect(out?.compareDocumentPosition(level as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(level?.compareDocumentPosition(zoomIn as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(zoomIn?.compareDocumentPosition(zoomFit as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(level?.textContent).toBe('100 %');
  });

  test('[UI-BOARD-5] names the fit button with the Shift+1 shortcut', () => {
    expect(item('zoom-fit')?.getAttribute('aria-label')).toBe(
      'Recadrer sur tout le contenu (Shift+1)',
    );
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

describe('[F02-S4-AC5] fit button', () => {
  test('[F02-S4-AC5] fits the viewport on the whole content', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    renderWithDoc(doc);

    act(() => {
      item('zoom-fit')?.click();
    });

    expect(useViewportStore.getState().viewport).toEqual(
      fitViewport({ x: 0, y: 0, width: 100, height: 100 }, CANVAS),
    );
  });

  test('[F02-S4-AC5] returns to the default viewport on an empty board', () => {
    const doc = createBoardDoc();
    renderWithDoc(doc);
    act(() => {
      useViewportStore.getState().fitToContent({ x: 0, y: 0, width: 2000, height: 1000 }, CANVAS);
    });
    expect(useViewportStore.getState().viewport).not.toEqual(DEFAULT_VIEWPORT);

    act(() => {
      item('zoom-fit')?.click();
    });

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });

  test('[F02-S4-AC5] has no effect outside a board', () => {
    act(() => {
      item('zoom-fit')?.click();
    });

    expect(useViewportStore.getState().viewport).toEqual(DEFAULT_VIEWPORT);
  });
});
