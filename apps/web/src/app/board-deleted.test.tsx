// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BoardDeleted } from './board-deleted';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  window.history.pushState({}, '', '/b/abc123');
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('[F01-S4-AC4] board deleted message', () => {
  test('[F01-S4-AC4] shows the message and goes back to the boards menu', () => {
    act(() => {
      root.render(<BoardDeleted />);
    });

    const dialog = document.querySelector('[data-testid="board-deleted"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Ce board a été supprimé');

    const back = document.querySelector<HTMLElement>('[data-testid="nav-boards"]');
    expect(back).not.toBeNull();
    act(() => {
      back?.click();
    });
    expect(window.location.pathname).toBe('/');
  });
});
