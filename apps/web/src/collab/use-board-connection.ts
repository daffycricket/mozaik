import { HocuspocusProvider } from '@hocuspocus/provider';
import {
  type BoardDoc,
  type BoardHistory,
  createBoardDoc,
  createBoardHistory,
} from '@mozaik/model';
import { useEffect, useMemo, useState } from 'react';
import { BoardNotFoundError, getBoard } from '@/lib/boards-api';
import { collabUrl } from './collab-url';

export type BoardConnection = {
  doc: BoardDoc;
  provider: HocuspocusProvider | null;
  history: BoardHistory | null;
  isSynced: boolean;
  isDeleted: boolean;
};

/**
 * Connects a board document to the collaboration server through a Hocuspocus provider.
 * When the server closes the connection and the board no longer exists, the
 * board is reported as deleted (F01-S4-AC4).
 */
export function useBoardConnection(boardId: string): BoardConnection {
  const doc = useMemo(() => createBoardDoc(), []);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [history, setHistory] = useState<BoardHistory | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    const nextHistory = createBoardHistory(doc);
    setHistory(nextHistory);
    const next = new HocuspocusProvider({
      name: boardId,
      url: collabUrl(window.location),
      document: doc,
    });
    let cancelled = false;
    const onSynced = (data: { state: boolean }): void => {
      setIsSynced(data.state);
    };
    const onClose = (): void => {
      getBoard(boardId).catch((error: unknown) => {
        if (!cancelled && error instanceof BoardNotFoundError) {
          setIsDeleted(true);
        }
      });
    };
    next.on('synced', onSynced);
    next.on('close', onClose);
    setProvider(next);
    return () => {
      cancelled = true;
      next.off('synced', onSynced);
      next.off('close', onClose);
      next.destroy();
      nextHistory.destroy();
      setHistory(null);
    };
  }, [boardId, doc]);

  return { doc, provider, history, isSynced, isDeleted };
}
