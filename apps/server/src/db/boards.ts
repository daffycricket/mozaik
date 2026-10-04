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
 * Tells whether a board exists, used to guard collaboration connections.
 */
export function boardExists(db: BoardDatabase, id: string): boolean {
  const row = db.prepare('SELECT 1 AS found FROM boards WHERE id = ?').get(id) as
    | { found: number }
    | undefined;
  return row !== undefined;
}

/**
 * Deletes a board and its Yjs document. Returns false when the board is unknown.
 */
export function deleteBoard(db: BoardDatabase, id: string): boolean {
  if (!boardExists(db, id)) {
    return false;
  }
  db.transaction(() => {
    db.prepare('DELETE FROM documents WHERE name = ?').run(id);
    db.prepare('DELETE FROM boards WHERE id = ?').run(id);
  })();
  return true;
}

/**
 * Deletes every board and its document. Used by the test-only reset route.
 */
export function resetBoards(db: BoardDatabase): void {
  db.transaction(() => {
    db.prepare('DELETE FROM documents').run();
    db.prepare('DELETE FROM boards').run();
  })();
}
