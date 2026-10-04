import type { BoardHistory } from '@mozaik/model';
import { createContext, useContext } from 'react';

/**
 * Undo/redo history of the board, provided by the board view alongside the
 * document.
 */
export const HistoryContext = createContext<BoardHistory | null>(null);

/**
 * Returns the board history, or `null` outside of a board view.
 */
export function useBoardHistory(): BoardHistory | null {
  return useContext(HistoryContext);
}
