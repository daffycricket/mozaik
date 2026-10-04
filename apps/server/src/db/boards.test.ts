import { describe, expect, test } from 'vitest';
import { createBoard, resetBoards } from './boards';
import { openDatabase } from './index';

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
