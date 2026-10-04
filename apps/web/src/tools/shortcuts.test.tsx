// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { useToolStore } from '@/state/tool-store';
import { useSpacePan, useToolShortcuts } from './shortcuts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  useToolShortcuts();
  const isSpaceHeld = useSpacePan();
  const tool = useToolStore((state) => state.tool);
  return (
    <div data-testid="probe">
      {tool}:{isSpaceHeld ? 'space' : 'idle'}
    </div>
  );
}

function probeText(): string {
  return document.querySelector('[data-testid="probe"]')?.textContent ?? '';
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

describe('[F02-S1-AC2] tool shortcuts', () => {
  test('[F02-S1-AC2] switches to the hand tool with H and back with V', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    });
    expect(probeText()).toBe('hand:idle');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
    });
    expect(probeText()).toBe('select:idle');
  });

  test('[F02-S1-AC2] ignores the shortcuts while a text field has focus', () => {
    const input = document.createElement('input');
    container.appendChild(input);
    input.focus();

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
    });
    expect(probeText()).toBe('select:idle');
  });
});

describe('[F02-S1-AC3] space pan', () => {
  test('[F02-S1-AC3] holds the space pan while the space bar is down', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', cancelable: true }));
    });
    expect(probeText()).toBe('select:space');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    });
    expect(probeText()).toBe('select:idle');
  });
});
