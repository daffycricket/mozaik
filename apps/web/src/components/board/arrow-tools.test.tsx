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

describe('[F06-S1-AC1] arrow tool', () => {
  test('[F06-S1-AC1] lists the arrow after the text tool', () => {
    const text = item('tool-text');
    const arrow = item('tool-arrow');
    expect(arrow).not.toBeNull();
    expect(text?.compareDocumentPosition(arrow as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('[F06-S1-AC1] activates the arrow tool on click', () => {
    act(() => {
      item('tool-arrow')?.click();
    });
    expect(useToolStore.getState().tool).toBe('arrow');
    expect(item('tool-arrow')?.getAttribute('aria-pressed')).toBe('true');
  });
});
