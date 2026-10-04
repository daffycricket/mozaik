import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import type { Board } from '@/lib/boards-api';
import { BoardScreen, BoardShell } from './board-page';

vi.mock('@/identity/name-dialog', () => ({
  NameDialog: () => <div data-testid="name-dialog" />,
}));

const board: Board = {
  id: 'abc123',
  name: 'Rétro S12',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

const handlers = { onEnter: () => {}, onBack: () => {} };

describe('BoardShell', () => {
  test('renders the boards link and the board name above the canvas', () => {
    const html = renderToStaticMarkup(<BoardShell name="Rétro S12" />);

    expect(html).toContain('data-testid="board-header"');
    expect(html).toContain('data-testid="nav-boards"');
    expect(html).toContain('data-testid="board-name"');
    expect(html).toContain('Rétro S12');
    expect(html).toContain('data-testid="board-canvas"');
  });
});

describe('BoardScreen', () => {
  test('[F01-S5-AC1] renders the not found page when the board is missing', () => {
    const html = renderToStaticMarkup(
      <BoardScreen read={{ status: 'missing' }} identity={null} boardId="abc123" {...handlers} />,
    );

    expect(html).toContain('data-testid="board-not-found"');
    expect(html).not.toContain('data-testid="name-dialog"');
    expect(html).not.toContain('data-testid="board-canvas"');
  });

  test('renders nothing while the board is loading', () => {
    const html = renderToStaticMarkup(
      <BoardScreen read={{ status: 'loading' }} identity={null} boardId="abc123" {...handlers} />,
    );

    expect(html).toBe('');
  });

  test('asks for the name before showing a board without an identity', () => {
    const html = renderToStaticMarkup(
      <BoardScreen
        read={{ status: 'found', board }}
        identity={null}
        boardId="abc123"
        {...handlers}
      />,
    );

    expect(html).toContain('data-testid="name-dialog"');
    expect(html).not.toContain('data-testid="board-canvas"');
  });

  test('renders the board when it is found and the identity is known', () => {
    const html = renderToStaticMarkup(
      <BoardScreen
        read={{ status: 'found', board }}
        identity={{ id: 'user-1', name: 'Nico' }}
        boardId="abc123"
        {...handlers}
      />,
    );

    expect(html).toContain('data-testid="board-canvas"');
    expect(html).toContain('Rétro S12');
  });
});
