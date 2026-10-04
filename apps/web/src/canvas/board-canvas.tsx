import { useEffect, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';

/**
 * Konva stage of the board, sized to fill its container. The element rendering
 * itself lands with the element stories.
 */
export function BoardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
  }, []);

  return (
    <div ref={containerRef} data-testid="board-canvas" className="h-full w-full overflow-hidden">
      <Stage width={size.width} height={size.height}>
        <Layer />
      </Stage>
    </div>
  );
}
