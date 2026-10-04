// @vitest-environment happy-dom
import { type BoardDoc, createBoardDoc, createElement } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useStartEditingShortcut } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function Probe({ doc }: { doc: BoardDoc }) {
  useStartEditingShortcut(doc);
  return <div />;
}

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
  useEditingStore.setState({ editingId: null });
  useSelectionStore.setState({ selection: [] });
});

describe('[F03-S2-AC1] start editing shortcut', () => {
  test('[F03-S2-AC1] enters editing on Enter when a single sticky is selected', () => {
    const doc = createBoardDoc();
    const sticky = createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 200, height: 200 },
      { id: 's1', createdBy: 'u' },
    );

    act(() => {
      root.render(<Probe doc={doc} />);
    });
    act(() => {
      useSelectionStore.setState({ selection: [sticky.id] });
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(useEditingStore.getState().editingId).toBe('s1');
    doc.destroy();
  });

  test('[F03-S2-AC1] does not enter editing when several elements are selected', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 200, height: 200 },
      { id: 's1', createdBy: 'u' },
    );
    createElement(
      doc,
      { type: 'sticky', x: 300, y: 0, width: 200, height: 200 },
      { id: 's2', createdBy: 'u' },
    );

    act(() => {
      root.render(<Probe doc={doc} />);
    });
    act(() => {
      useSelectionStore.setState({ selection: ['s1', 's2'] });
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(useEditingStore.getState().editingId).toBeNull();
    doc.destroy();
  });

  test('[F03-S2-AC1] does not enter editing while a text field has focus', () => {
    const doc = createBoardDoc();
    const sticky = createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 200, height: 200 },
      { id: 's1', createdBy: 'u' },
    );

    act(() => {
      root.render(<Probe doc={doc} />);
    });
    act(() => {
      useSelectionStore.setState({ selection: [sticky.id] });
    });

    const textarea = document.createElement('textarea');
    container.appendChild(textarea);
    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(useEditingStore.getState().editingId).toBeNull();
    doc.destroy();
  });
});
