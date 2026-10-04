// @vitest-environment happy-dom
import { createBoardDoc, createBoardHistory, createElement, getElement } from '@mozaik/model';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { HistoryContext } from '@/collab/history-context';
import { useToolStore } from '@/state/tool-store';
import { Toolbar } from './toolbar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Toolbar />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  useToolStore.setState({ tool: 'select' });
});

function item(testId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

describe('[UI-BOARD-3] toolbar layout', () => {
  test('[UI-BOARD-3] exposes a vertical toolbar with the selection then the hand tool', () => {
    const toolbar = item('toolbar');
    expect(toolbar?.getAttribute('role')).toBe('toolbar');
    expect(toolbar?.getAttribute('aria-orientation')).toBe('vertical');

    const select = item('tool-select');
    const hand = item('tool-hand');
    expect(select).not.toBeNull();
    expect(hand).not.toBeNull();
    expect(select?.compareDocumentPosition(hand as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('[UI-BOARD-3] separates the tools from the undo and redo buttons', () => {
    const sticky = item('tool-sticky');
    const undo = item('undo');
    const redo = item('redo');
    expect(document.querySelector('[role="separator"]')).not.toBeNull();
    expect(sticky).not.toBeNull();
    expect(undo).not.toBeNull();
    expect(redo).not.toBeNull();
    expect(sticky?.compareDocumentPosition(undo as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(undo?.compareDocumentPosition(redo as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

describe('[UI-BOARD-4] active tool', () => {
  test('[UI-BOARD-4] marks the selection tool as pressed by default', () => {
    expect(item('tool-select')?.getAttribute('aria-pressed')).toBe('true');
    expect(item('tool-hand')?.getAttribute('aria-pressed')).toBe('false');
  });

  test('[UI-BOARD-4] moves the pressed state to the hand tool', () => {
    act(() => {
      useToolStore.getState().setTool('hand');
    });
    expect(item('tool-hand')?.getAttribute('aria-pressed')).toBe('true');
    expect(item('tool-select')?.getAttribute('aria-pressed')).toBe('false');
  });

  test('[UI-BOARD-4] activates the hand tool on click', () => {
    act(() => {
      item('tool-hand')?.click();
    });
    expect(useToolStore.getState().tool).toBe('hand');
  });
});

describe('[F08-S2-AC3] history buttons', () => {
  test('[F08-S2-AC3] disables undo and redo without history and toggles them with actions', () => {
    const doc = createBoardDoc();
    const history = createBoardHistory(doc);
    act(() => {
      root.render(
        <HistoryContext.Provider value={history}>
          <Toolbar />
        </HistoryContext.Provider>,
      );
    });

    expect((item('undo') as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((item('redo') as HTMLButtonElement | null)?.disabled).toBe(true);

    act(() => {
      createElement(
        doc,
        { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
        { id: 's1', createdBy: 'u' },
      );
    });
    expect((item('undo') as HTMLButtonElement | null)?.disabled).toBe(false);
    expect((item('redo') as HTMLButtonElement | null)?.disabled).toBe(true);

    act(() => {
      item('undo')?.click();
    });
    expect(getElement(doc, 's1')).toBeUndefined();
    expect((item('undo') as HTMLButtonElement | null)?.disabled).toBe(true);
    expect((item('redo') as HTMLButtonElement | null)?.disabled).toBe(false);

    act(() => {
      item('redo')?.click();
    });
    expect(getElement(doc, 's1')).toBeDefined();

    history.destroy();
    doc.destroy();
  });
});
