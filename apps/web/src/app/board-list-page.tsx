import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type Board, createBoard, DEFAULT_BOARD_NAME, listBoards } from '@/lib/boards-api';
import { formatRelativeDate } from '@/lib/relative-date';
import { navigate } from './routes';

type BoardListProps = {
  boards: Board[] | null;
  isCreating: boolean;
  onCreate: () => void;
  onOpen: (boardId: string) => void;
};

/**
 * Menu of the boards. `boards` is null while the list is loading.
 */
export function BoardList({ boards, isCreating, onCreate, onOpen }: BoardListProps) {
  return (
    <main className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Boards</h1>
        <Button type="button" data-testid="board-create" onClick={onCreate} disabled={isCreating}>
          <Plus aria-hidden="true" />
          Nouveau board
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {boards === null ? null : boards.length === 0 ? (
          <BoardEmpty onCreate={onCreate} isCreating={isCreating} />
        ) : (
          <div className="p-6">
            <ul
              data-testid="board-list"
              className="mx-auto w-full max-w-[720px] divide-y divide-border overflow-hidden rounded-lg border"
            >
              {boards.map((board) => (
                <BoardRow key={board.id} board={board} onOpen={onOpen} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

function BoardEmpty({ onCreate, isCreating }: { onCreate: () => void; isCreating: boolean }) {
  return (
    <div
      data-testid="board-empty"
      className="flex h-full flex-col items-center justify-center gap-4"
    >
      <p className="text-muted-foreground">Aucun board pour l&apos;instant.</p>
      <Button
        type="button"
        data-testid="board-empty-create"
        onClick={onCreate}
        disabled={isCreating}
      >
        <Plus aria-hidden="true" />
        Créer un board
      </Button>
    </div>
  );
}

function BoardRow({ board, onOpen }: { board: Board; onOpen: (boardId: string) => void }) {
  return (
    <li data-testid="board-item" className="flex items-center bg-background hover:bg-accent">
      <a
        href={`/b/${board.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3"
        onClick={(event) => {
          event.preventDefault();
          onOpen(board.id);
        }}
      >
        <span className="truncate font-medium">{board.name}</span>
        <span className="shrink-0 text-sm text-muted-foreground">
          modifié {formatRelativeDate(board.updatedAt, new Date())}
        </span>
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-testid="board-delete"
        aria-label={`Supprimer ${board.name}`}
        className="mr-2 text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

/**
 * Loads the board list and handles board creation from the menu.
 */
export function BoardListPage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listBoards()
      .then((result) => {
        if (!cancelled) {
          setBoards(result);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setBoards([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <BoardList
      boards={boards}
      isCreating={isCreating}
      onCreate={() => {
        void createAndOpenBoard();
      }}
      onOpen={(boardId) => navigate(`/b/${boardId}`)}
    />
  );
}
