import { useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';

function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const update = (): void => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  return size;
}

/**
 * Konva stage of the board. The element rendering itself lands with the element stories.
 */
export function BoardCanvas() {
  const { width, height } = useWindowSize();
  return (
    <Stage width={width} height={height}>
      <Layer />
    </Stage>
  );
}
