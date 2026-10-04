import * as Y from 'yjs';
import { ELEMENTS_KEY, LOCAL_ORIGIN } from './ops';

/**
 * Undo/redo history of a board, limited to the local user's transactions so
 * undoing never reverts another user's work (F08, ADR-0004).
 */
export type BoardHistory = Y.UndoManager;

/**
 * Creates the undo manager of a board document, tracking only the local
 * transactions. Consecutive drag writes are merged into a single entry as long
 * as they stay within the capture timeout (F07-S2).
 */
export function createBoardHistory(doc: Y.Doc): BoardHistory {
  return new Y.UndoManager(doc.getMap(ELEMENTS_KEY), {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
  });
}
