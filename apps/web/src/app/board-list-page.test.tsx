import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import type { Board } from '@/lib/boards-api';
import { BoardList } from './board-list-page';

const board: Board = {
  id: 'abc123456789',
  name: 'Rétro S12',
  createdAt: '2026-10-04T10:00:00.000Z',
  updatedAt: '2026-10-04T10:00:00.000Z',
};

function render(boards: Board[] | null): string {
  return renderToStaticMarkup(
    <BoardList
      boards={boards}
      isCreating={false}
      onCreate={() => {}}
      onOpen={() => {}}
      onDelete={() => {}}
    />,
  );
}

describe('[F01-S2-AC1] board list menu', () => {
  test('[F01-S2-AC1] renders each board with its name, date and delete control', () => {
    const html = render([board]);

    expect(html).toContain('data-testid="board-list"');
    expect(html).toContain('data-testid="board-item"');
    expect(html).toContain('Rétro S12');
    expect(html).toContain('modifié');
    expect(html).toContain('data-testid="board-delete"');
  });

  test('[F01-S2-AC2] renders the empty state when there is no board', () => {
    const html = render([]);

    expect(html).toContain('data-testid="board-empty"');
    expect(html).toContain('Aucun board pour l&#x27;instant.');
    expect(html).toContain('data-testid="board-empty-create"');
  });

  test('renders the header without a list while loading', () => {
    const html = render(null);

    expect(html).toContain('Boards');
    expect(html).toContain('data-testid="board-create"');
    expect(html).not.toContain('data-testid="board-list"');
    expect(html).not.toContain('data-testid="board-empty"');
  });
});
