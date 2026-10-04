// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElement } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { TextEditor } from './text-editor';

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
  useEditingStore.setState({ editingId: null });
});

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('[F03-S1-AC2] text editor overlay', () => {
  test('[F03-S1-AC2] shows the existing text and commits it on Escape', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200, text: 'Idée' },
      { id: 's1', createdBy: 'u' },
    );
    if (created.type !== 'sticky') {
      throw new Error('expected a sticky element');
    }

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    const textarea = container.querySelector('textarea');
    expect(textarea?.getAttribute('data-testid')).toBe('text-editor');
    expect(textarea?.value).toBe('Idée');

    act(() => {
      if (textarea !== null) {
        setTextareaValue(textarea, 'Idée 1');
      }
    });
    expect(getElement(doc, 's1')).toMatchObject({ text: 'Idée' });

    act(() => {
      textarea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(getElement(doc, 's1')).toMatchObject({ text: 'Idée 1' });

    doc.destroy();
  });
});
