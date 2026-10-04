// @vitest-environment happy-dom
import type { HocuspocusProvider } from '@hocuspocus/provider';
import { DEFAULT_VIEWPORT, userColor } from '@mozaik/model';
import { act, type ReactNode, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useViewportStore } from '@/state/viewport-store';
import { PresenceContext, type PresenceSession } from './presence-context';
import { useLocalCursor } from './use-local-cursor';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setAwarenessField = vi.fn();
const provider = { setAwarenessField } as unknown as HocuspocusProvider;
const identity = { id: 'user-1', name: 'Nico L' };

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  useLocalCursor(ref);
  return <div ref={ref} data-testid="canvas" />;
}

function Detached() {
  const ref = useRef<HTMLDivElement>(null);
  useLocalCursor(ref);
  return <div data-testid="other" />;
}

let container: HTMLDivElement;
let root: Root;
let mounted = true;

function render(node: ReactNode, session: PresenceSession | null): void {
  act(() => {
    root.render(
      session === null ? (
        node
      ) : (
        <PresenceContext.Provider value={session}>{node}</PresenceContext.Provider>
      ),
    );
  });
}

function canvas(): HTMLDivElement {
  const element = container.querySelector<HTMLDivElement>('[data-testid="canvas"]');
  if (element === null) {
    throw new Error('Expected the canvas element');
  }
  element.getBoundingClientRect = (): DOMRect =>
    ({ left: 10, top: 20, width: 200, height: 200 }) as DOMRect;
  return element;
}

function pointerMove(element: HTMLDivElement, x: number, y: number): void {
  act(() => {
    element.dispatchEvent(
      new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }),
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  mounted = true;
  setAwarenessField.mockClear();
  useViewportStore.setState({ viewport: { ...DEFAULT_VIEWPORT } });
});

afterEach(() => {
  if (mounted) {
    act(() => {
      root.unmount();
    });
  }
  container.remove();
  vi.restoreAllMocks();
  setAwarenessField.mockClear();
});

describe('[F10-S2-AC1] local cursor publication', () => {
  test('[F10-S2-AC1] publishes the user and a null cursor on mount', () => {
    render(<Probe />, { provider, identity });

    expect(setAwarenessField).toHaveBeenCalledWith('user', {
      id: 'user-1',
      name: 'Nico L',
      color: userColor('user-1'),
    });
    expect(setAwarenessField).toHaveBeenCalledWith('cursor', null);
  });

  test('[F10-S2-AC1] publishes the cursor in world coordinates on pointer move', () => {
    render(<Probe />, { provider, identity });
    setAwarenessField.mockClear();

    pointerMove(canvas(), 110, 120);

    expect(setAwarenessField).toHaveBeenLastCalledWith('cursor', { x: 100, y: 100 });
  });

  test('[F10-S2-AC1] does nothing without a presence session', () => {
    render(<Probe />, null);
    expect(setAwarenessField).not.toHaveBeenCalled();
  });

  test('[F10-S2-AC1] publishes the user even without a canvas element', () => {
    render(<Detached />, { provider, identity });
    expect(setAwarenessField).toHaveBeenCalledWith('cursor', null);
  });
});

describe('[F10-S2-AC2] cursor throttling', () => {
  test('[F10-S2-AC2] sends at most one update per 50 ms and flushes the last one', async () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    render(<Probe />, { provider, identity });
    const element = canvas();
    setAwarenessField.mockClear();

    pointerMove(element, 20, 30);
    expect(setAwarenessField).toHaveBeenLastCalledWith('cursor', { x: 10, y: 10 });
    const afterFirst = setAwarenessField.mock.calls.length;

    pointerMove(element, 40, 50);
    expect(setAwarenessField.mock.calls.length).toBe(afterFirst);

    now = 1100;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 70));
    });
    expect(setAwarenessField).toHaveBeenLastCalledWith('cursor', { x: 30, y: 30 });
  });
});

describe('[F10-S2-AC4] local cursor removal', () => {
  test('[F10-S2-AC4] clears the cursor on unmount', () => {
    render(<Probe />, { provider, identity });
    pointerMove(canvas(), 110, 120);
    setAwarenessField.mockClear();

    act(() => {
      root.unmount();
    });
    mounted = false;

    expect(setAwarenessField).toHaveBeenLastCalledWith('cursor', null);
  });
});
