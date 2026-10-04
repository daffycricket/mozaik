import { describe, expect, test } from 'vitest';
import { createBoard, getBoard, listBoards, resetBoards } from './boards';
import { openDatabase } from './index';

function insertBoard(
  db: ReturnType<typeof openDatabase>,
  id: string,
  name: string,
  updatedAt: string,
): void {
  db.prepare('INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
    id,
    name,
    updatedAt,
    updatedAt,
  );
}

describe('[T-002-AC7] board store', () => {
  test('[T-002-AC7] creates a board with a 12-character id', () => {
    const db = openDatabase(':memory:');
    const board = createBoard(db, 'Rétro S12');
    expect(board.id).toHaveLength(12);
    expect(board.name).toBe('Rétro S12');
    expect(board.createdAt).toBe(board.updatedAt);
    const row = db.prepare('SELECT COUNT(*) AS count FROM boards').get() as { count: number };
    expect(row.count).toBe(1);
    db.close();
  });

  test('[T-002-AC7] resets every board', () => {
    const db = openDatabase(':memory:');
    createBoard(db, 'Premier');
    createBoard(db, 'Second');
    resetBoards(db);
    const row = db.prepare('SELECT COUNT(*) AS count FROM boards').get() as { count: number };
    expect(row.count).toBe(0);
    db.close();
  });
});

describe('[F01-S2-AC1] board list store', () => {
  test('[F01-S2-AC1] lists boards from the most recently modified to the oldest', () => {
    const db = openDatabase(':memory:');
    insertBoard(db, 'old', 'Ancien', '2026-09-28T10:00:00.000Z');
    insertBoard(db, 'new', 'Récent', '2026-10-04T10:00:00.000Z');
    insertBoard(db, 'middle', 'Milieu', '2026-10-01T10:00:00.000Z');

    expect(listBoards(db).map((board) => board.id)).toEqual(['new', 'middle', 'old']);
    db.close();
  });

  test('reads a board by id and returns null for an unknown id', () => {
    const db = openDatabase(':memory:');
    insertBoard(db, 'board-1', 'Rétro S12', '2026-10-04T10:00:00.000Z');

    expect(getBoard(db, 'board-1')).toEqual({
      id: 'board-1',
      name: 'Rétro S12',
      createdAt: '2026-10-04T10:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z',
    });
    expect(getBoard(db, 'missing')).toBeNull();
    db.close();
  });
});
