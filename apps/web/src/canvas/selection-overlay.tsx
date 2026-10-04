import type { Box } from '@mozaik/model';
import { Rect } from 'react-konva';
import { readProjectToken } from '@/lib/theme-tokens';

/**
 * Selection frame drawn around the selected elements, in world coordinates.
 * The stroke is divided by the zoom to stay one screen pixel thick.
 */
export function SelectionOverlay({ box, zoom }: { box: Box; zoom: number }) {
  return (
    <Rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      stroke={readProjectToken('--selection')}
      strokeWidth={1 / zoom}
      listening={false}
    />
  );
}
