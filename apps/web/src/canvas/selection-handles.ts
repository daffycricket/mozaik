import type { Box, Point } from '@mozaik/model';

/**
 * Size of a selection handle, in screen pixels (design/composants.md).
 */
export const HANDLE_SIZE = 8;

export type SelectionHandle = Point & { id: string };

const HANDLE_POSITIONS: Array<{ id: string; fx: number; fy: number }> = [
  { id: 'nw', fx: 0, fy: 0 },
  { id: 'n', fx: 0.5, fy: 0 },
  { id: 'ne', fx: 1, fy: 0 },
  { id: 'w', fx: 0, fy: 0.5 },
  { id: 'e', fx: 1, fy: 0.5 },
  { id: 'sw', fx: 0, fy: 1 },
  { id: 's', fx: 0.5, fy: 1 },
  { id: 'se', fx: 1, fy: 1 },
];

/**
 * The eight square handles of a selection: four corners and the midpoint of
 * each side (UI-BOARD-10), in the coordinate system of `box`.
 */
export function selectionHandles(box: Box): SelectionHandle[] {
  return HANDLE_POSITIONS.map(({ id, fx, fy }) => ({
    id,
    x: box.x + box.width * fx,
    y: box.y + box.height * fy,
  }));
}
