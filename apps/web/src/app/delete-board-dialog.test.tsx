// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Board } from '@/lib/boards-api';
import { DeleteBoardDialog } from './delete-board-dialog';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const board: Board = {
  id: 'abc123456789',
  name: 'Rétro S12',
  createdAt: '2026-10-04T10:00:00.000Z',
  updatedAt: '2026-10-04T10:00:00.000Z',
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function renderDialog(onCancel: () => void, onConfirm: () => void): void {
  act(() => {
    root.render(<DeleteBoardDialog board={board} onCancel={onCancel} onConfirm={onConfirm} />);
  });
}

describe('[UI-MENU-6] delete board dialog', () => {
  test('[UI-MENU-6] shows the confirmation and confirms the deletion', () => {
    const onConfirm = vi.fn();
    renderDialog(() => {}, onConfirm);

    const dialog = document.querySelector('[data-testid="delete-dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Supprimer « Rétro S12 » ?');
    expect(dialog?.textContent).toContain('Cette action est définitive.');

    const confirm = document.querySelector<HTMLElement>('[data-testid="delete-confirm"]');
    expect(confirm).not.toBeNull();
    act(() => {
      confirm?.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('[UI-MENU-6] cancels the deletion with the cancel button', () => {
    const onCancel = vi.fn();
    renderDialog(onCancel, () => {});

    const cancel = document.querySelector<HTMLElement>('[data-testid="delete-cancel"]');
    expect(cancel).not.toBeNull();
    act(() => {
      cancel?.click();
    });
    expect(onCancel).toHaveBeenCalled();
  });

  test('[UI-MENU-6] cancels the deletion with Escape', () => {
    const onCancel = vi.fn();
    renderDialog(onCancel, () => {});

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onCancel).toHaveBeenCalled();
  });
});
