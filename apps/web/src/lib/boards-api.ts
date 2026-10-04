import { z } from 'zod';

const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Board = z.infer<typeof boardSchema>;

export const DEFAULT_BOARD_NAME = 'Board sans titre';

export const MAX_BOARD_NAME_LENGTH = 100;

export type BoardNameValidation = { ok: true; name: string } | { ok: false };

/**
 * Validates a raw board name: trimmed, 1 to 100 characters.
 */
export function validateBoardName(raw: string): BoardNameValidation {
  const name = raw.trim();
  if (name.length === 0 || name.length > MAX_BOARD_NAME_LENGTH) {
    return { ok: false };
  }
  return { ok: true, name };
}

/**
 * Returns the trimmed name to persist when it is valid and differs from the
 * current one, or null when the rename must be ignored.
 */
export function nextBoardName(currentName: string, raw: string): string | null {
  const result = validateBoardName(raw);
  if (!result.ok || result.name === currentName) {
    return null;
  }
  return result.name;
}

/**
 * Raised by getBoard when the requested board does not exist.
 */
export class BoardNotFoundError extends Error {
  constructor(id: string) {
    super(`Board ${id} read failed with status 404`);
    this.name = 'BoardNotFoundError';
  }
}

/**
 * Lists every board, most recently modified first.
 */
export async function listBoards(): Promise<Board[]> {
  const response = await fetch('/api/boards');
  if (!response.ok) {
    throw new Error(`Board list failed with status ${response.status}`);
  }
  return z.array(boardSchema).parse(await response.json());
}

/**
 * Reads a board by id through the REST API.
 */
export async function getBoard(id: string): Promise<Board> {
  const response = await fetch(`/api/boards/${encodeURIComponent(id)}`);
  if (response.status === 404) {
    throw new BoardNotFoundError(id);
  }
  if (!response.ok) {
    throw new Error(`Board read failed with status ${response.status}`);
  }
  return boardSchema.parse(await response.json());
}

/**
 * Renames a board through the REST API and returns the persisted board.
 */
export async function renameBoard(id: string, name: string): Promise<Board> {
  const response = await fetch(`/api/boards/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Board rename failed with status ${response.status}`);
  }
  return boardSchema.parse(await response.json());
}

/**
 * Creates a board through the REST API and returns the persisted board.
 */
export async function createBoard(name: string): Promise<Board> {
  const response = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Board creation failed with status ${response.status}`);
  }
  return boardSchema.parse(await response.json());
}
