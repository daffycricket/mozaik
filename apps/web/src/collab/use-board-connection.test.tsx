// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BoardNotFoundError, getBoard } from '@/lib/boards-api';
import { useBoardConnection } from './use-board-connection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  return {
    emit(event: string, payload?: unknown): void {
      for (const handler of handlers.get(event) ?? []) {
        handler(payload);
      }
    },
    provider: {
      awareness: undefined,
      destroy: (): void => {},
      off: (event: string, handler: (payload: unknown) => void): void => {
        handlers.get(event)?.delete(handler);
      },
      on: (event: string, handler: (payload: unknown) => void): void => {
        const set = handlers.get(event) ?? new Set();
        set.add(handler);
        handlers.set(event, set);
      },
    },
  };
});

vi.mock('@hocuspocus/provider', () => ({
  HocuspocusProvider: class {
    awareness = mocks.provider.awareness;
    destroy = mocks.provider.destroy;
    off = mocks.provider.off;
    on = mocks.provider.on;
  },
}));

vi.mock('@/lib/boards-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/boards-api')>();
  return { ...actual, getBoard: vi.fn() };
});

function Probe() {
  const { isDeleted } = useBoardConnection('board-1');
  return <div data-testid="probe">{isDeleted ? 'deleted' : 'active'}</div>;
}

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
  vi.clearAllMocks();
});

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('[F01-S4-AC4] board connection deletion detection', () => {
  test('[F01-S4-AC4] reports the board as deleted when the server closes the connection', async () => {
    vi.mocked(getBoard).mockRejectedValue(new BoardNotFoundError('board-1'));
    act(() => {
      root.render(<Probe />);
    });
    await flush();

    mocks.emit('close');
    await flush();

    expect(document.querySelector('[data-testid="probe"]')?.textContent).toBe('deleted');
  });

  test('[F01-S4-AC4] keeps the board active when it still exists after a close', async () => {
    vi.mocked(getBoard).mockResolvedValue({
      id: 'board-1',
      name: 'Rétro S12',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
    });
    act(() => {
      root.render(<Probe />);
    });
    await flush();

    mocks.emit('close');
    await flush();

    expect(document.querySelector('[data-testid="probe"]')?.textContent).toBe('active');
  });
});
