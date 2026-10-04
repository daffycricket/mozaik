import { useEffect } from 'react';
import { BoardCanvas } from '@/canvas/board-canvas';
import { useBoardConnection } from '@/collab/use-board-connection';
import { createBoardApi, exposeBoardApi } from '@/testing/board-api';

/**
 * Board page: connects the collaboration document and renders its canvas.
 */
export function BoardPage({ boardId }: { boardId: string }) {
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
