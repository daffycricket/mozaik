// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useToolStore } from '@/state/tool-store';
import { useToolShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  useToolShortcuts();
  const tool = useToolStore((state) => state.tool);
  return <div data-testid="probe">{tool}</div>;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
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
  useToolStore.setState({ tool: 'select' });
});

describe('[F03-S1-AC1] sticky tool shortcut', () => {
  test('[F03-S1-AC1] activates the sticky tool with N', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    });
    expect(useToolStore.getState().tool).toBe('sticky');
  });
});
