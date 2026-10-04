import type { BoardHistory } from '@mozaik/model';
import { useEffect, useState } from 'react';

export type HistoryState = { canUndo: boolean; canRedo: boolean };

const HISTORY_EVENTS = [
  'stack-item-added',
  'stack-item-popped',
  'stack-item-updated',
  'stack-cleared',
] as const;

/**
 * Subscribes to the undo manager events and reports whether there is something
 * to undo or redo, so the toolbar buttons can be disabled (F08-S2-AC3).
 */
export function useHistoryState(history: BoardHistory | null): HistoryState {
  const [state, setState] = useState<HistoryState>({ canUndo: false, canRedo: false });

  useEffect(() => {
    if (history === null) {
      setState({ canUndo: false, canRedo: false });
      return;
    }
    const update = (): void => {
      setState({ canUndo: history.canUndo(), canRedo: history.canRedo() });
    };
    update();
    for (const event of HISTORY_EVENTS) {
      history.on(event, update);
    }
    return () => {
      for (const event of HISTORY_EVENTS) {
        history.off(event, update);
      }
    };
  }, [history]);

  return state;
}
