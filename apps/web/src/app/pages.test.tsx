import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { App } from './app';

function memoryStorage(entries: Record<string, string>): Storage {
  const store = new Map(Object.entries(entries));
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe('App routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the board list at the root route', () => {
    const html = renderToStaticMarkup(<App route={{ kind: 'board-list' }} />);

    expect(html).toContain('data-testid="board-create"');
  });

  test('gates a board route without a stored identity behind the name dialog', () => {
    const html = renderToStaticMarkup(<App route={{ kind: 'board', boardId: 'abc123' }} />);

    expect(html).not.toContain('data-testid="board-canvas"');
  });

  test('renders the board canvas on a board route with a stored identity', () => {
    vi.stubGlobal(
      'localStorage',
      memoryStorage({
        'mozaik.identity': JSON.stringify({ id: 'user-1', name: 'Nico' }),
      }),
    );

    const html = renderToStaticMarkup(<App route={{ kind: 'board', boardId: 'abc123' }} />);

    expect(html).toContain('data-testid="board-canvas"');
  });

  test('defaults to the board list', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Mozaik');
  });
});
