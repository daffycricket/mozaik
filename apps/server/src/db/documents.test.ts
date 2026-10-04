import { describe, expect, test, vi } from 'vitest';
import { createBoard } from './boards';
import { loadDocumentState, storeDocumentState } from './documents';
import { openDatabase } from './index';

describe('[T-003-AC2] document store', () => {
  test('[T-003-AC2] upserts the Yjs state and touches the board modification date', () => {
    const db = openDatabase(':memory:');
    const board = createBoard(db, 'Rétro S12');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    storeDocumentState(db, board.id, new Uint8Array([1, 2, 3]));
    storeDocumentState(db, board.id, new Uint8Array([4, 5]));
    vi.useRealTimers();

    expect([...(loadDocumentState(db, board.id) ?? [])]).toEqual([4, 5]);
    const rows = db.prepare('SELECT COUNT(*) AS count FROM documents').get() as { count: number };
    expect(rows.count).toBe(1);
    const updated = db.prepare('SELECT updated_at FROM boards WHERE id = ?').get(board.id) as {
      updated_at: string;
    };
    expect(updated.updated_at).toBe('2030-01-01T00:00:00.000Z');
    db.close();
  });

  test('[T-003-AC2] ignores a document whose board does not exist', () => {
    const db = openDatabase(':memory:');
    storeDocumentState(db, 'missing-board', new Uint8Array([1]));
    const rows = db.prepare('SELECT COUNT(*) AS count FROM documents').get() as { count: number };
    expect(rows.count).toBe(0);
    expect(loadDocumentState(db, 'missing-board')).toBeNull();
    db.close();
  });
});
