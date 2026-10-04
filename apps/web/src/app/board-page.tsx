import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BoardCanvas } from '@/canvas/board-canvas';
import { useBoardConnection } from '@/collab/use-board-connection';
import { Button } from '@/components/ui/button';
import {
  createIdentity,
  loadStoredIdentity,
  storeIdentity,
  type UserIdentity,
} from '@/identity/identity';
import { NameDialog } from '@/identity/name-dialog';
import { getBoard } from '@/lib/boards-api';
import { createBoardApi, exposeBoardApi } from '@/testing/board-api';
import { navigate } from './routes';

/**
 * Board page: asks for the user name before connecting to the collaboration
 * document, so an unidentified visitor does not appear to the other peers.
 */
export function BoardPage({ boardId }: { boardId: string }) {
  const [identity, setIdentity] = useState<UserIdentity | null>(() => loadStoredIdentity());

  function enter(name: string): void {
    const next = createIdentity(name, crypto.randomUUID());
    storeIdentity(next);
    setIdentity(next);
  }

  if (identity === null) {
    return <NameDialog onSubmit={enter} onBack={() => navigate('/')} />;
  }

  return <BoardView boardId={boardId} />;
}

function BoardView({ boardId }: { boardId: string }) {
  const { doc, provider } = useBoardConnection(boardId);
  const [name, setName] = useState('');

  useEffect(() => {
    exposeBoardApi(createBoardApi({ doc, provider }));
  }, [doc, provider]);

  useEffect(() => {
    let cancelled = false;
    getBoard(boardId)
      .then((board) => {
        if (!cancelled) {
          setName(board.name);
        }
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  return <BoardShell name={name} />;
}

/**
 * Board chrome: the header with the boards link and the board name, above the canvas.
 */
export function BoardShell({ name }: { name: string }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header
        data-testid="board-header"
        className="flex h-12 shrink-0 items-center gap-2 border-b px-3"
      >
        <Button
          type="button"
          variant="ghost"
          data-testid="nav-boards"
          onClick={() => navigate('/')}
        >
          <ArrowLeft aria-hidden="true" />
          Boards
        </Button>
        <span data-testid="board-name" className="truncate font-semibold">
          {name}
        </span>
      </header>
      <div className="relative min-h-0 flex-1">
        <BoardCanvas />
      </div>
    </div>
  );
}
