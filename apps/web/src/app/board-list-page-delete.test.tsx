// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Board } from '@/lib/boards-api';
import { BoardListPage } from './board-list-page';

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
  vi.unstubAllGlobals();
});

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function stubFetch(boards: Board[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'DELETE') {
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify(boards), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('[F01-S4-AC1] delete a board from the menu', () => {
  test('[F01-S4-AC1] removes the board from the list after a confirmed deletion', async () => {
    const fetchMock = stubFetch([board]);
    act(() => {
      root.render(<BoardListPage />);
    });
    await flush();
    expect(document.querySelector('[data-testid="board-item"]')).not.toBeNull();

    act(() => {
      document.querySelector<HTMLElement>('[data-testid="board-delete"]')?.click();
    });
    expect(document.querySelector('[data-testid="delete-dialog"]')).not.toBeNull();

    await act(async () => {
      document.querySelector<HTMLElement>('[data-testid="delete-confirm"]')?.click();
    });
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/boards/${board.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(document.querySelector('[data-testid="board-item"]')).toBeNull();
  });

  test('[F01-S4-AC2] keeps the board when the dialog is cancelled', async () => {
    const fetchMock = stubFetch([board]);
    act(() => {
      root.render(<BoardListPage />);
    });
    await flush();

    act(() => {
      document.querySelector<HTMLElement>('[data-testid="board-delete"]')?.click();
    });
    act(() => {
      document.querySelector<HTMLElement>('[data-testid="delete-cancel"]')?.click();
    });
    await flush();

    expect(document.querySelector('[data-testid="board-item"]')).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith(
      `/api/boards/${board.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
