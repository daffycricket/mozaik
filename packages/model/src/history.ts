import * as Y from 'yjs';
import { ELEMENTS_KEY, LOCAL_ORIGIN } from './ops';

/**
 * Undo/redo history of a board, limited to the local user's transactions so
 * undoing never reverts another user's work (F08, ADR-0004).
 */
export type BoardHistory = Y.UndoManager;

/**
 * Merge window between two consecutive local transactions that belong to the
 * same user action. Short, so distinct clicks stay separate undo entries.
 */
export const HISTORY_CAPTURE_TIMEOUT_MS = 500;

/**
 * Merge window while a drag gesture is in progress. A gesture must always be a
 * single undo entry, even when the main thread stalls for a while between two
 * intermediate writes (which would otherwise split it at the default timeout);
 * the explicit `stopCapturing` boundaries keep distinct gestures and actions
 * apart.
 */
export const HISTORY_GESTURE_TIMEOUT_MS = 60_000;

/**
 * Creates the undo manager of a board document, tracking only the local
 * transactions. Consecutive drag writes are merged into a single entry as long
 * as they stay within the capture timeout (F07-S2).
 */
export function createBoardHistory(doc: Y.Doc): BoardHistory {
  return new Y.UndoManager(doc.getMap(ELEMENTS_KEY), {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
    captureTimeout: HISTORY_CAPTURE_TIMEOUT_MS,
  });
}

/**
 * Opens an atomic undo entry for a drag gesture: every write until
 * `endHistoryGesture` is merged into one entry, whatever the pauses in between
 * (F07-S2, F07-S3). The current entry is closed first so the gesture does not
 * absorb the previous action.
 */
export function beginHistoryGesture(history: BoardHistory): void {
  history.captureTimeout = HISTORY_GESTURE_TIMEOUT_MS;
  history.stopCapturing();
}

/**
 * Closes the atomic entry opened by `beginHistoryGesture` and restores the
 * default merge window.
 */
export function endHistoryGesture(history: BoardHistory): void {
  history.stopCapturing();
  history.captureTimeout = HISTORY_CAPTURE_TIMEOUT_MS;
}
