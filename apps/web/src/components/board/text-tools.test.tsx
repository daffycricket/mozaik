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

describe('[F05-S1-AC1] text tool', () => {
  test('[F05-S1-AC1] lists the text tool after the ellipse', () => {
    const ellipse = item('tool-ellipse');
    const text = item('tool-text');
    expect(text).not.toBeNull();
    expect(ellipse?.compareDocumentPosition(text as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('[F05-S1-AC1] activates the text tool on click', () => {
    act(() => {
      item('tool-text')?.click();
    });
    expect(useToolStore.getState().tool).toBe('text');
    expect(item('tool-text')?.getAttribute('aria-pressed')).toBe('true');
  });
});
