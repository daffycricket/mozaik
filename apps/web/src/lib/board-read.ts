import { type Board, BoardNotFoundError, getBoard } from './boards-api';

export type BoardRead =
  | { status: 'loading' }
  | { status: 'found'; board: Board }
  | { status: 'missing' };

/**
 * Reads a board, turning a missing board into a "missing" result and logging
 * any other read failure.
 */
export async function readBoard(boardId: string): Promise<BoardRead> {
  try {
    const board = await getBoard(boardId);
    return { status: 'found', board };
  } catch (error: unknown) {
    if (!(error instanceof BoardNotFoundError)) {
      console.error(error);
    }
    return { status: 'missing' };
  }
}
