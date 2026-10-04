import { HocuspocusProvider } from '@hocuspocus/provider';
import { type BoardDoc, createBoardDoc } from '@mozaik/model';
import { useEffect, useMemo, useState } from 'react';
import { collabUrl } from './collab-url';

export type BoardConnection = {
  doc: BoardDoc;
  provider: HocuspocusProvider | null;
  isSynced: boolean;
};

/**
 * Connects a board document to the collaboration server through a Hocuspocus provider.
 */
export function useBoardConnection(boardId: string): BoardConnection {
  const doc = useMemo(() => createBoardDoc(), []);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const next = new HocuspocusProvider({
      name: boardId,
      url: collabUrl(window.location),
      document: doc,
    });
    const onSynced = (data: { state: boolean }): void => {
      setIsSynced(data.state);
    };
    next.on('synced', onSynced);
    setProvider(next);
    return () => {
      next.off('synced', onSynced);
      next.destroy();
    };
  }, [boardId, doc]);

  return { doc, provider, isSynced };
}
