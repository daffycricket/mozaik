// @vitest-environment happy-dom
import {
  createBoardDoc,
  createElement,
  getElement,
  measureTextBox,
  TEXT_LINE_HEIGHT,
} from '@mozaik/model';
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

describe('[F03-S2-AC2] text editor validation', () => {
  test('[F03-S2-AC2] commits the text on Enter', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200, text: 'Idée' },
      { id: 's1', createdBy: 'u' },
    );
    if (created.type !== 'sticky') {
      throw new Error('expected a sticky element');
    }
    useEditingStore.setState({ editingId: 's1' });

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      if (textarea !== null) {
        setTextareaValue(textarea, 'Idée 1');
      }
    });
    act(() => {
      textarea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(getElement(doc, 's1')).toMatchObject({ text: 'Idée 1' });
    expect(useEditingStore.getState().editingId).toBeNull();
    doc.destroy();
  });

  test('[F03-S2-AC2] commits the text when the field loses focus', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200, text: 'Idée' },
      { id: 's1', createdBy: 'u' },
    );
    if (created.type !== 'sticky') {
      throw new Error('expected a sticky element');
    }
    useEditingStore.setState({ editingId: 's1' });

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      if (textarea !== null) {
        setTextareaValue(textarea, 'Idée 1');
      }
    });
    act(() => {
      textarea?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });

    expect(getElement(doc, 's1')).toMatchObject({ text: 'Idée 1' });
    expect(useEditingStore.getState().editingId).toBeNull();
    doc.destroy();
  });

  test('[F03-S2-AC2] limits the text to 2000 characters', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200, text: '' },
      { id: 's1', createdBy: 'u' },
    );
    if (created.type !== 'sticky') {
      throw new Error('expected a sticky element');
    }

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    expect(container.querySelector('textarea')?.getAttribute('maxlength')).toBe('2000');
    doc.destroy();
  });
});

describe('[F05-S1-AC2] empty free text removal', () => {
  test('[F05-S1-AC2] removes the text when validating without typing', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'text', x: 10, y: 20, ...measureTextBox('') },
      { id: 't1', createdBy: 'u' },
    );
    if (created.type !== 'text') {
      throw new Error('expected a text element');
    }
    useEditingStore.setState({ editingId: 't1' });

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    act(() => {
      container
        .querySelector('textarea')
        ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(getElement(doc, 't1')).toBeUndefined();
    expect(useEditingStore.getState().editingId).toBeNull();
    doc.destroy();
  });
});

describe('[F05-S1-AC3] free text auto size', () => {
  test('[F05-S1-AC3] sets the box height to the number of typed lines', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'text', x: 10, y: 20, ...measureTextBox('') },
      { id: 't1', createdBy: 'u' },
    );
    if (created.type !== 'text') {
      throw new Error('expected a text element');
    }
    useEditingStore.setState({ editingId: 't1' });

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      if (textarea !== null) {
        setTextareaValue(textarea, 'a\nb\nc');
      }
    });
    act(() => {
      textarea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(getElement(doc, 't1')).toMatchObject({
      text: 'a\nb\nc',
      height: 3 * TEXT_LINE_HEIGHT,
    });
    doc.destroy();
  });
});

describe('[F03-S2-AC3] text editor line break', () => {
  test('[F03-S2-AC3] keeps editing and does not commit on Shift+Enter', () => {
    const doc = createBoardDoc();
    const created = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200, text: 'Idée' },
      { id: 's1', createdBy: 'u' },
    );
    if (created.type !== 'sticky') {
      throw new Error('expected a sticky element');
    }
    useEditingStore.setState({ editingId: 's1' });

    act(() => {
      root.render(<TextEditor doc={doc} element={created} />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      textarea?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
      );
    });

    expect(getElement(doc, 's1')).toMatchObject({ text: 'Idée' });
    expect(useEditingStore.getState().editingId).toBe('s1');
    doc.destroy();
  });
});
