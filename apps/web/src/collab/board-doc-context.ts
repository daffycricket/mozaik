import type { BoardDoc } from '@mozaik/model';
import { createContext, useContext } from 'react';

/**
 * Board document shared with the canvas components, provided by the board view
 * once the collaboration connection is established.
 */
export const BoardDocContext = createContext<BoardDoc | null>(null);

/**
 * Returns the board document, or `null` outside of a board view.
 */
export function useBoardDoc(): BoardDoc | null {
  return useContext(BoardDocContext);
}
