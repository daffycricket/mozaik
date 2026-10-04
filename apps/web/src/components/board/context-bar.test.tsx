// @vitest-environment happy-dom
import {
  createBoardDoc,
  createElement,
  getElement,
  getElements,
  PALETTE_COLORS,
  sortByZIndex,
} from '@mozaik/model';
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

  test('[UI-BOARD-8] shows only the order buttons when the selection holds no recolourable element', () => {
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

    expect(item('context-bar')).not.toBeNull();
    expect(item('color-yellow')).toBeNull();
    expect(item('order-forward')).not.toBeNull();
    expect(item('order-backward')).not.toBeNull();
    doc.destroy();
  });
});

function orderOf(doc: ReturnType<typeof createBoardDoc>): string[] {
  return sortByZIndex(getElements(doc)).map((element) => element.id);
}

function orderBoard(): ReturnType<typeof createBoardDoc> {
  const doc = createBoardDoc();
  for (const [index, id] of ['a', 'b', 'c'].entries()) {
    createElement(
      doc,
      { type: 'sticky', x: index * 120, y: 0, width: 100, height: 100 },
      { id, createdBy: 'u', zIndex: `a${index}` },
    );
  }
  return doc;
}

describe('[F07-S4-AC1] context bar order buttons', () => {
  test('[F07-S4-AC1] advances the selection on "Avancer"', () => {
    const doc = orderBoard();
    act(() => {
      useSelectionStore.getState().setSelection(['a']);
    });
    render(doc);

    act(() => {
      item('order-forward')?.click();
    });

    expect(orderOf(doc)).toEqual(['b', 'a', 'c']);
    doc.destroy();
  });

  test('[F07-S4-AC2] sends the selection back on "Reculer"', () => {
    const doc = orderBoard();
    act(() => {
      useSelectionStore.getState().setSelection(['c']);
    });
    render(doc);

    act(() => {
      item('order-backward')?.click();
    });

    expect(orderOf(doc)).toEqual(['a', 'c', 'b']);
    doc.destroy();
  });

  test('[F07-S4-AC3] disables the buttons at the stacking limits', () => {
    const doc = orderBoard();
    act(() => {
      useSelectionStore.getState().setSelection(['a']);
    });
    render(doc);
    expect((item('order-backward') as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((item('order-forward') as HTMLButtonElement | null)?.disabled).toBe(false);

    act(() => {
      useSelectionStore.getState().setSelection(['c']);
    });
    expect((item('order-forward') as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((item('order-backward') as HTMLButtonElement | null)?.disabled).toBe(false);
    doc.destroy();
  });

  test('[F07-S4-AC4] moves every selected element while preserving their order', () => {
    const doc = orderBoard();
    act(() => {
      useSelectionStore.getState().setSelection(['a', 'b']);
    });
    render(doc);

    act(() => {
      item('order-forward')?.click();
    });

    expect(orderOf(doc)).toEqual(['c', 'a', 'b']);
    doc.destroy();
  });
});
