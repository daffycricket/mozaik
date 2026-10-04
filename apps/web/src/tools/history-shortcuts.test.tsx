// @vitest-environment happy-dom
import {
  type BoardHistory,
  createBoardDoc,
  createBoardHistory,
  createElement,
  getElement,
  moveElements,
} from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useHistoryShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let doc: ReturnType<typeof createBoardDoc>;
let history: BoardHistory;

function Probe() {
  useHistoryShortcuts(history);
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
  history = createBoardHistory(doc);
  history.stopCapturing();
  createElement(
    doc,
    { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
    { id: 's1', createdBy: 'u' },
  );
  history.stopCapturing();
  moveElements(doc, ['s1'], { x: 40, y: 20 });
  history.stopCapturing();

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
  history.destroy();
  doc.destroy();
});

describe('[F08-S2-AC1] history shortcuts', () => {
  test('[F08-S2-AC1] undoes the last local action with Ctrl+Z', () => {
    press('z', { ctrlKey: true });
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });
  });

  test('[F08-S2-AC1] redoes the last undone action with Ctrl+Shift+Z', () => {
    press('z', { ctrlKey: true });
    press('Z', { ctrlKey: true, shiftKey: true });
    expect(getElement(doc, 's1')).toMatchObject({ x: 40, y: 20 });
  });

  test('[F08-S2-AC1] undoes the creation after undoing the move', () => {
    press('z', { ctrlKey: true });
    press('z', { ctrlKey: true });
    expect(getElement(doc, 's1')).toBeUndefined();
  });

  test('[F08-S2-AC1] ignores the shortcuts while a text field has focus', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    });
    expect(getElement(doc, 's1')).toMatchObject({ x: 40, y: 20 });
    input.remove();
  });
});
