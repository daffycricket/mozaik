// @vitest-environment happy-dom
import { createBoardDoc, createElement, getElements } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useClipboardShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let doc: ReturnType<typeof createBoardDoc>;
let container: HTMLDivElement;
let root: Root;

function Probe() {
  useClipboardShortcuts(doc);
  return <div data-testid="probe" />;
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true }));
  });
}

async function pressAsync(key: string): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function copyOf(originalId: string) {
  const copy = getElements(doc).find((element) => element.id !== originalId);
  if (copy === undefined) {
    throw new Error('Expected a copy');
  }
  return copy;
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
      readText: vi.fn().mockRejectedValue(new Error('denied')),
    },
    configurable: true,
  });
  localStorage.setItem('mozaik.identity', JSON.stringify({ id: 'u', name: 'Test' }));
  doc = createBoardDoc();
  createElement(
    doc,
    { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
    { id: 'a', createdBy: 'u' },
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
  localStorage.clear();
});

describe('[F08-S3-AC1] duplicate shortcut', () => {
  test('[F08-S3-AC1] duplicates the selection with Ctrl+D', () => {
    useSelectionStore.setState({ selection: ['a'] });

    press('d');

    const elements = getElements(doc);
    expect(elements).toHaveLength(2);
    const copy = copyOf('a');
    expect(copy).toMatchObject({ type: 'sticky', x: 20, y: 20, createdBy: 'u' });
    expect(useSelectionStore.getState().selection).toEqual([copy.id]);
  });

  test('[F08-S3-AC1] ignores Ctrl+D without a selection or while editing', () => {
    press('d');
    expect(getElements(doc)).toHaveLength(1);

    useSelectionStore.setState({ selection: ['a'] });
    useEditingStore.setState({ editingId: 'a' });
    press('d');
    expect(getElements(doc)).toHaveLength(1);
  });
});

describe('[F08-S3-AC2] copy and paste shortcuts', () => {
  test('[F08-S3-AC2] copies then pastes the selection with Ctrl+C and Ctrl+V', async () => {
    useSelectionStore.setState({ selection: ['a'] });

    press('c');
    await pressAsync('v');

    const elements = getElements(doc);
    expect(elements).toHaveLength(2);
    const copy = copyOf('a');
    expect(copy).toMatchObject({ type: 'sticky', x: 20, y: 20 });
    expect(useSelectionStore.getState().selection).toEqual([copy.id]);
  });
});
