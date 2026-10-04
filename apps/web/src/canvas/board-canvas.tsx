import { useEffect, useRef } from 'react';
import { Layer, Stage } from 'react-konva';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';
import { usePan } from './use-pan';
import { useWheelZoom } from './use-zoom';

const GRID_STEP = 32;

/**
 * Konva stage of the board, sized to fill its container. The dot grid follows
 * the local viewport (pan and zoom); the element rendering itself lands with
 * the element stories.
 */
export function BoardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useCanvasSizeStore((state) => state.size);
  const setSize = useCanvasSizeStore((state) => state.setSize);
  const viewport = useViewportStore((state) => state.viewport);
  const pan = usePan(containerRef);
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
      className="h-full w-full overflow-hidden"
      style={gridStyle}
      onPointerDown={pan.onPointerDown}
      onPointerMove={pan.onPointerMove}
      onPointerUp={pan.onPointerUp}
      onPointerCancel={pan.onPointerUp}
    >
      <Stage width={size.width} height={size.height}>
        <Layer />
      </Stage>
    </div>
  );
}
