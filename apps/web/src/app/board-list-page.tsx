import { useState } from 'react';
import { createBoard, DEFAULT_BOARD_NAME } from '@/lib/boards-api';
import { navigate } from './routes';

/**
 * Menu of the boards. Only the creation entry point exists until the list story.
 */
export function BoardListPage() {
  const [isCreating, setIsCreating] = useState(false);

  async function createAndOpenBoard(): Promise<void> {
    setIsCreating(true);
    try {
      const board = await createBoard(DEFAULT_BOARD_NAME);
      navigate(`/b/${board.id}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Mozaik</h1>
        <button
          type="button"
          data-testid="board-create"
          onClick={() => {
            void createAndOpenBoard();
          }}
          disabled={isCreating}
        >
          Nouveau board
        </button>
      </header>
    </main>
  );
}
