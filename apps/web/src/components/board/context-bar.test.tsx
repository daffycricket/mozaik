// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElement, PALETTE_COLORS } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BoardDocContext } from '@/collab/board-doc-context';
import { useSelectionStore } from '@/state/selection-store';
import { ContextBar } from './context-bar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  useSelectionStore.setState({ selection: [] });
});

function item(testId: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function render(doc: ReturnType<typeof createBoardDoc>): void {
  act(() => {
    root.render(
      <BoardDocContext.Provider value={doc}>
        <ContextBar />
      </BoardDocContext.Provider>,
    );
  });
}

describe('[F03-S3-AC2] context bar palette', () => {
  test('[F03-S3-AC2] offers the ten palette colours and marks the current one', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    act(() => {
      useSelectionStore.getState().setSelection(['s1']);
    });
    render(doc);

    for (const color of PALETTE_COLORS) {
      expect(item(`color-${color}`)).not.toBeNull();
    }
    expect(item('color-yellow')?.getAttribute('aria-pressed')).toBe('true');
    expect(item('color-blue')?.getAttribute('aria-pressed')).toBe('false');

    doc.destroy();
  });

  test('[F03-S3-AC2] marks no colour when the selection mixes colours', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100, color: 'blue' },
      { id: 's1', createdBy: 'u' },
    );
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100, color: 'red' },
      { id: 's2', createdBy: 'u' },
    );
    act(() => {
      useSelectionStore.getState().setSelection(['s1', 's2']);
    });
    render(doc);

    for (const color of PALETTE_COLORS) {
      expect(item(`color-${color}`)?.getAttribute('aria-pressed')).toBe('false');
    }
    doc.destroy();
  });
});

describe('[F03-S3-AC1] recolour the selection', () => {
  test('[F03-S3-AC1] recolours every selected sticky note on colour click', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's2', createdBy: 'u' },
    );
    createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 50, height: 20 },
      { id: 'r1', createdBy: 'u' },
    );
    act(() => {
      useSelectionStore.getState().setSelection(['s1', 's2', 'r1']);
    });
    render(doc);

    act(() => {
      item('color-blue')?.click();
    });

    expect(getElement(doc, 's1')).toMatchObject({ color: 'blue' });
    expect(getElement(doc, 's2')).toMatchObject({ color: 'blue' });
    expect(getElement(doc, 'r1')).not.toHaveProperty('color');
    expect(item('color-blue')?.getAttribute('aria-pressed')).toBe('true');
    doc.destroy();
  });

  test('[F03-S3-AC1] hides the bar when the selection holds no recolourable element', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 50, height: 20 },
      { id: 'r1', createdBy: 'u' },
    );
    act(() => {
      useSelectionStore.getState().setSelection(['r1']);
    });
    render(doc);

    expect(item('context-bar')).toBeNull();
    doc.destroy();
  });
});
