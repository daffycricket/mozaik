import { boardExists } from './boards';
import type { BoardDatabase } from './index';

/**
 * Reads the stored Yjs state of a board document, or null when none exists.
 */
export function loadDocumentState(db: BoardDatabase, name: string): Uint8Array | null {
  const row = db.prepare('SELECT state FROM documents WHERE name = ?').get(name) as
    | { state: Buffer }
    | undefined;
  return row === undefined ? null : row.state;
}

/**
 * Upserts the Yjs state of a board document and touches the board modification date.
 * A document whose board no longer exists is dropped, so a late store cannot resurrect it.
 */
export function storeDocumentState(db: BoardDatabase, name: string, state: Uint8Array): void {
  if (!boardExists(db, name)) {
    return;
  }
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO documents (name, state, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(name, Buffer.from(state), now);
  db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(now, name);
}
