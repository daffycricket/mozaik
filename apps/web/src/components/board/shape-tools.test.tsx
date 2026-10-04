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

describe('[F04-S1-AC1] shape tools', () => {
  test('[F04-S1-AC1] lists the rectangle after the sticky and before the ellipse', () => {
    const sticky = item('tool-sticky');
    const rect = item('tool-rect');
    const ellipse = item('tool-ellipse');
    expect(rect).not.toBeNull();
    expect(ellipse).not.toBeNull();
    expect(sticky?.compareDocumentPosition(rect as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(rect?.compareDocumentPosition(ellipse as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('[F04-S1-AC1] activates the rectangle tool on click', () => {
    act(() => {
      item('tool-rect')?.click();
    });
    expect(useToolStore.getState().tool).toBe('rect');
    expect(item('tool-rect')?.getAttribute('aria-pressed')).toBe('true');
  });

  test('[F04-S1-AC4] activates the ellipse tool on click', () => {
    act(() => {
      item('tool-ellipse')?.click();
    });
    expect(useToolStore.getState().tool).toBe('ellipse');
    expect(item('tool-ellipse')?.getAttribute('aria-pressed')).toBe('true');
  });
});
