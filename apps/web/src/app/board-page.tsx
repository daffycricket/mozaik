import { ArrowLeft } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { BoardCanvas } from '@/canvas/board-canvas';
import { BoardDocContext } from '@/collab/board-doc-context';
import { PresenceContext } from '@/collab/presence-context';
import { useBoardConnection } from '@/collab/use-board-connection';
import { ContextBar } from '@/components/board/context-bar';
import { Toolbar } from '@/components/board/toolbar';
import { ZoomControls } from '@/components/board/zoom-controls';
import { Button } from '@/components/ui/button';
import {
  createIdentity,
  loadStoredIdentity,
  storeIdentity,
  type UserIdentity,
} from '@/identity/identity';
import { NameDialog } from '@/identity/name-dialog';
import { type BoardRead, readBoard } from '@/lib/board-read';
import { renameBoard } from '@/lib/boards-api';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useSelectionStore } from '@/state/selection-store';
import { useViewportStore } from '@/state/viewport-store';
import { createBoardApi, exposeBoardApi } from '@/testing/board-api';
import { useToolShortcuts, useZoomShortcuts } from '@/tools/shortcuts';
import { BoardDeleted } from './board-deleted';
import { BoardName } from './board-name';
import { BoardNotFound } from './board-not-found';
import { navigate } from './routes';

type BoardScreenProps = {
  read: BoardRead;
  identity: UserIdentity | null;
  boardId: string;
  onEnter: (name: string) => void;
  onBack: () => void;
  onRename: (name: string) => void;
};

/**
 * Renders the screen matching the board read and the stored identity: the error
 * page for a missing board, the name dialog for an unidentified visitor, and
 * the board otherwise.
 */
export function BoardScreen({
  read,
  identity,
  boardId,
  onEnter,
  onBack,
  onRename,
}: BoardScreenProps): ReactNode {
  if (read.status === 'missing') {
    return <BoardNotFound />;
  }
  if (read.status === 'loading') {
    return null;
  }
  if (identity === null) {
    return <NameDialog onSubmit={onEnter} onBack={onBack} />;
  }
  return (
    <BoardView boardId={boardId} identity={identity} name={read.board.name} onRename={onRename} />
  );
}

/**
 * Board page: reads the board before asking for the user name and before
 * connecting, so a missing board shows an error page without a name prompt
 * or a collaboration socket.
 */
export function BoardPage({ boardId }: { boardId: string }) {
  const [identity, setIdentity] = useState<UserIdentity | null>(() => loadStoredIdentity());
  const [read, setRead] = useState<BoardRead>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setRead({ status: 'loading' });
    readBoard(boardId).then((result) => {
      if (!cancelled) {
        setRead(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  function enter(name: string): void {
    const next = createIdentity(name, crypto.randomUUID());
    storeIdentity(next);
    setIdentity(next);
  }

  function rename(name: string): void {
    void renameBoard(boardId, name)
      .then((board) => {
        setRead({ status: 'found', board });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }

  return (
    <BoardScreen
      read={read}
      identity={identity}
      boardId={boardId}
      onEnter={enter}
      onBack={() => navigate('/')}
      onRename={rename}
    />
  );
}

function BoardView({
  boardId,
  identity,
  name,
  onRename,
}: {
  boardId: string;
  identity: UserIdentity;
  name: string;
  onRename: (name: string) => void;
}) {
  const { doc, provider, isDeleted } = useBoardConnection(boardId);
  const resetViewport = useViewportStore((state) => state.resetViewport);
  useToolShortcuts();
  useZoomShortcuts();

  useEffect(() => {
    resetViewport();
  }, [resetViewport]);

  useEffect(() => {
    exposeBoardApi(
      createBoardApi({
        doc,
        provider,
        getViewport: () => useViewportStore.getState().viewport,
        getSelection: () => useSelectionStore.getState().selection,
        getCanvasSize: () => useCanvasSizeStore.getState().size,
      }),
    );
  }, [doc, provider]);

  const session = useMemo(
    () => (provider === null ? null : { provider, identity }),
    [provider, identity],
  );

  return (
    <BoardDocContext.Provider value={doc}>
      <PresenceContext.Provider value={session}>
        <BoardShell name={name} onRename={onRename} />
        {isDeleted && <BoardDeleted />}
      </PresenceContext.Provider>
    </BoardDocContext.Provider>
  );
}

/**
 * Board chrome: the header with the boards link and the board name, above the canvas.
 */
export function BoardShell({ name, onRename }: { name: string; onRename: (name: string) => void }) {
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
        <BoardName name={name} onRename={onRename} />
      </header>
      <div className="relative min-h-0 flex-1">
        <BoardCanvas />
        <ContextBar />
        <Toolbar />
        <ZoomControls />
      </div>
    </div>
  );
}
