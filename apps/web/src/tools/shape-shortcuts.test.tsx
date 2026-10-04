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

describe('[F04-S1-AC1] shape tool shortcuts', () => {
  test('[F04-S1-AC1] activates the rectangle tool with R', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });
    expect(useToolStore.getState().tool).toBe('rect');
  });

  test('[F04-S1-AC4] activates the ellipse tool with O', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
    });
    expect(useToolStore.getState().tool).toBe('ellipse');
  });
});
