import type { ArrowElement, Box } from '@mozaik/model';
import { Circle, Group, Rect } from 'react-konva';
import { readProjectToken } from '@/lib/theme-tokens';
import { HANDLE_SIZE, selectionHandles } from './selection-handles';

/**
 * Selection frame drawn around the selected elements, in world coordinates,
 * with its eight square handles (UI-BOARD-10). Sizes and stroke are divided by
 * the zoom to stay constant on screen.
 */
export function SelectionOverlay({ box, zoom }: { box: Box; zoom: number }) {
  const stroke = readProjectToken('--selection');
  const strokeWidth = 1 / zoom;
  const handleSize = HANDLE_SIZE / zoom;
  const half = handleSize / 2;
  return (
    <Group listening={false}>
      <Rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {selectionHandles(box).map((handle) => (
        <Rect
          key={handle.id}
          x={handle.x - half}
          y={handle.y - half}
          width={handleSize}
          height={handleSize}
          fill={readProjectToken('--handle-fill')}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
    </Group>
  );
}

/**
 * Selection overlay of a single arrow: two round handles at its endpoints, with
 * no frame (UI-BOARD-10). Sizes and stroke are divided by the zoom to stay
 * constant on screen.
 */
export function ArrowSelectionOverlay({ element, zoom }: { element: ArrowElement; zoom: number }) {
  const stroke = readProjectToken('--selection');
  const fill = readProjectToken('--handle-fill');
  const strokeWidth = 1 / zoom;
  const radius = HANDLE_SIZE / 2 / zoom;
  return (
    <Group listening={false}>
      {[
        { x: element.x1, y: element.y1 },
        { x: element.x2, y: element.y2 },
      ].map((point) => (
        <Circle
          key={`${point.x}:${point.y}`}
          x={point.x}
          y={point.y}
          radius={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
    </Group>
  );
}

/**
 * Rectangle dragged from an empty area to select the elements it fully contains
 * (F07-S1-AC3).
 */
export function SelectionMarquee({ box, zoom }: { box: Box; zoom: number }) {
  return (
    <Rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      fill={readProjectToken('--selection-fill')}
      stroke={readProjectToken('--selection')}
      strokeWidth={1 / zoom}
      listening={false}
    />
  );
}
