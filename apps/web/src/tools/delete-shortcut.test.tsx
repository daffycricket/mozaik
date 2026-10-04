// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElements } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useDeleteShortcut } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let doc: ReturnType<typeof createBoardDoc>;

function Probe() {
  useDeleteShortcut(doc);
  return <div data-testid="probe" />;
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
}

function ids(): string[] {
  return getElements(doc).map((element) => element.id);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  doc = createBoardDoc();
  for (const [index, id] of ['a', 'b', 'c'].entries()) {
    createElement(
      doc,
      { type: 'sticky', x: index * 120, y: 0, width: 100, height: 100 },
      { id, createdBy: 'u' },
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

describe('[F08-S1-AC1] delete shortcut', () => {
  test('[F08-S1-AC1] deletes the selection with the Delete key', () => {
    useSelectionStore.setState({ selection: ['a', 'b'] });
    press('Delete');
    expect(ids()).toEqual(['c']);
    expect(useSelectionStore.getState().selection).toEqual([]);
  });

  test('[F08-S1-AC1] deletes the selection with the Backspace key', () => {
    useSelectionStore.setState({ selection: ['c'] });
    press('Backspace');
    expect(ids()).toEqual(['a', 'b']);
  });

  test('[F08-S1-AC1] ignores the keys without a selection', () => {
    press('Delete');
    press('Backspace');
    expect(ids()).toEqual(['a', 'b', 'c']);
  });
});

describe('[F08-S1-AC2] no deletion while editing', () => {
  test('[F08-S1-AC2] ignores the keys while a text field has focus', () => {
    useSelectionStore.setState({ selection: ['a'] });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    });
    expect(ids()).toEqual(['a', 'b', 'c']);
    input.remove();
  });

  test('[F08-S1-AC2] ignores the keys while an element is being edited', () => {
    useSelectionStore.setState({ selection: ['a'] });
    useEditingStore.setState({ editingId: 'a' });
    press('Backspace');
    expect(ids()).toEqual(['a', 'b', 'c']);
  });
});
