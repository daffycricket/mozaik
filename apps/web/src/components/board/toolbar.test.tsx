// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
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
