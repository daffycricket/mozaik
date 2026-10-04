import { unionBounds } from '@mozaik/model';
import { useEffect, useRef } from 'react';
import { Layer, Stage } from 'react-konva';
import { useBoardDoc } from '@/collab/board-doc-context';
import { useBoardHistory } from '@/collab/history-context';
import { usePresenceSession } from '@/collab/presence-context';
import { useLocalCursor } from '@/collab/use-local-cursor';
import { TextEditor } from '@/components/board/text-editor';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useViewportStore } from '@/state/viewport-store';
import {
  useMoveShortcuts,
  useOrderShortcuts,
  useStartEditingShortcut,
  useUndoShortcut,
} from '@/tools/shortcuts';
import { BoardElements } from './board-elements';
import { RemoteCursors } from './remote-cursors';
import { SelectionMarquee, SelectionOverlay } from './selection-overlay';
import { useCreateSticky } from './use-create';
import { useElements } from './use-elements';
import { usePan } from './use-pan';
import { useSelect } from './use-select';
import { useWheelZoom } from './use-zoom';

const GRID_STEP = 32;

/**
 * Konva stage of the board, sized to fill its container. The dot grid follows
 * the local viewport (pan and zoom); the elements are rendered in world
 * coordinates inside a layer scaled by the zoom.
 */
export function BoardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const doc = useBoardDoc();
  const history = useBoardHistory();
  const size = useCanvasSizeStore((state) => state.size);
  const setSize = useCanvasSizeStore((state) => state.setSize);
  const viewport = useViewportStore((state) => state.viewport);
  const selection = useSelectionStore((state) => state.selection);
  const editingId = useEditingStore((state) => state.editingId);
  const elements = useElements(doc);
  const session = usePresenceSession();
  const pan = usePan(containerRef);
  const marquee = useSelect(containerRef, doc, history);
  useCreateSticky(containerRef, doc);
  useStartEditingShortcut(doc);
  useMoveShortcuts(doc);
  useOrderShortcuts(doc);
  useUndoShortcut(history);
  useLocalCursor(containerRef);
  useWheelZoom(containerRef);

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    const update = (): void => {
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [setSize]);

  const selected = elements.filter((element) => selection.includes(element.id));
  const selectionBox = unionBounds(
    selected.map((element) => ({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    })),
  );
  const edited = elements.find((element) => element.id === editingId);
  const editable =
    doc !== null && edited !== undefined && (edited.type === 'sticky' || edited.type === 'text')
      ? edited
      : null;

  const gridSize = GRID_STEP * viewport.zoom;
  const gridStyle = {
    backgroundColor: 'var(--canvas-bg)',
    backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${-viewport.x * viewport.zoom}px ${-viewport.y * viewport.zoom}px`,
  };

  return (
    <div
      ref={containerRef}
      data-testid="board-canvas"
      className="relative h-full w-full overflow-hidden"
      style={gridStyle}
      onPointerDown={pan.onPointerDown}
      onPointerMove={pan.onPointerMove}
      onPointerUp={pan.onPointerUp}
      onPointerCancel={pan.onPointerUp}
    >
      <Stage width={size.width} height={size.height}>
        <Layer
          x={-viewport.x * viewport.zoom}
          y={-viewport.y * viewport.zoom}
          scaleX={viewport.zoom}
          scaleY={viewport.zoom}
        >
          <BoardElements elements={elements} editingId={editingId} />
          {selectionBox !== null && <SelectionOverlay box={selectionBox} zoom={viewport.zoom} />}
          {marquee !== null && <SelectionMarquee box={marquee} zoom={viewport.zoom} />}
          {session !== null && (
            <RemoteCursors provider={session.provider} viewport={viewport} size={size} />
          )}
        </Layer>
      </Stage>
      {doc !== null && editable !== null && <TextEditor doc={doc} element={editable} />}
    </div>
  );
}
