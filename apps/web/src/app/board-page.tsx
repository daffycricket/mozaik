import { useEffect, useState } from 'react';
import { BoardCanvas } from '@/canvas/board-canvas';
import { useBoardConnection } from '@/collab/use-board-connection';
import {
  createIdentity,
  loadStoredIdentity,
  storeIdentity,
  type UserIdentity,
} from '@/identity/identity';
import { NameDialog } from '@/identity/name-dialog';
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

  useEffect(() => {
    exposeBoardApi(createBoardApi({ doc, provider }));
  }, [doc, provider]);

  return (
    <div data-testid="board-canvas">
      <BoardCanvas />
    </div>
  );
}
