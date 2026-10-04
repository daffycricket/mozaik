import {
  type Box,
  type Point,
  RESIZE_HANDLE_ORDER,
  type ResizeHandle,
  resizeHandlePoint,
} from '@mozaik/model';

/**
 * Size of a selection handle, in screen pixels (design/composants.md).
 */
export const HANDLE_SIZE = 8;

export type SelectionHandle = Point & { id: ResizeHandle };

/**
 * The eight square handles of a selection: four corners and the midpoint of
 * each side (UI-BOARD-10), in the coordinate system of `box`.
 */
export function selectionHandles(box: Box): SelectionHandle[] {
  return RESIZE_HANDLE_ORDER.map((id) => ({ id, ...resizeHandlePoint(box, id) }));
}
