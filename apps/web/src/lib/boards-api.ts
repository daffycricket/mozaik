import { z } from 'zod';

const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Board = z.infer<typeof boardSchema>;

export const DEFAULT_BOARD_NAME = 'Board sans titre';

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
