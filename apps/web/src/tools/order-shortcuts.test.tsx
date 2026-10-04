// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElements, sortByZIndex } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useOrderShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let doc: ReturnType<typeof createBoardDoc>;

function Probe() {
  useOrderShortcuts(doc);
  return <div data-testid="probe" />;
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
}

function order(): string[] {
  return sortByZIndex(getElements(doc)).map((element) => element.id);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  doc = createBoardDoc();
  for (const [index, id] of ['a', 'b', 'c'].entries()) {
    createElement(
      doc,
      { type: 'sticky', x: index * 120, y: 0, width: 100, height: 100 },
      { id, createdBy: 'u', zIndex: `a${index}` },
    );
  }
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
  useSelectionStore.setState({ selection: [] });
  useEditingStore.setState({ editingId: null });
});

describe('[F07-S4-AC1] order shortcuts', () => {
  test('[F07-S4-AC1] advances the selection with the "]" key', () => {
    useSelectionStore.setState({ selection: ['a'] });
    press(']');
    expect(order()).toEqual(['b', 'a', 'c']);
  });

  test('[F07-S4-AC2] sends the selection back with the "[" key', () => {
    useSelectionStore.setState({ selection: ['c'] });
    press('[');
    expect(order()).toEqual(['a', 'c', 'b']);
  });

  test('[F07-S4-AC1] ignores the key without a selection', () => {
    press(']');
    expect(order()).toEqual(['a', 'b', 'c']);
  });

  test('[F07-S4-AC1] ignores the key while a text field has focus', () => {
    useSelectionStore.setState({ selection: ['a'] });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: ']', bubbles: true }));
    });
    expect(order()).toEqual(['a', 'b', 'c']);
    input.remove();
  });
});
