// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElement } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useMoveShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let doc: ReturnType<typeof createBoardDoc>;

function Probe() {
  useMoveShortcuts(doc);
  return <div data-testid="probe" />;
}

function press(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));
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

describe('[F07-S2-AC2] move shortcuts', () => {
  test('[F07-S2-AC2] moves the selection by one world unit with an arrow', () => {
    useSelectionStore.setState({ selection: ['s1'] });
    press('ArrowRight');
    expect(getElement(doc, 's1')).toMatchObject({ x: 1, y: 0 });

    press('ArrowDown');
    expect(getElement(doc, 's1')).toMatchObject({ x: 1, y: 1 });
  });

  test('[F07-S2-AC2] moves the selection by ten world units with Shift', () => {
    useSelectionStore.setState({ selection: ['s1'] });
    press('ArrowLeft', { shiftKey: true });
    press('ArrowUp', { shiftKey: true });
    expect(getElement(doc, 's1')).toMatchObject({ x: -10, y: -10 });
  });

  test('[F07-S2-AC2] ignores the arrows without a selection', () => {
    press('ArrowRight');
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });
  });

  test('[F07-S2-AC2] ignores the arrows while a text field has focus', () => {
    useSelectionStore.setState({ selection: ['s1'] });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });
    input.remove();
  });
});
