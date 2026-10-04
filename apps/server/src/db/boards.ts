import { nanoid } from 'nanoid';
import type { BoardDatabase } from './index';

export type Board = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Inserts a board with a fresh 12-character id and returns it.
 */
export function createBoard(db: BoardDatabase, name: string): Board {
  const now = new Date().toISOString();
  const board: Board = { id: nanoid(12), name, createdAt: now, updatedAt: now };
  db.prepare('INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
    board.id,
    board.name,
    board.createdAt,
    board.updatedAt,
  );
  return board;
}

/**
 * Deletes every board. Used by the test-only reset route.
 */
export function resetBoards(db: BoardDatabase): void {
  db.prepare('DELETE FROM boards').run();
}
