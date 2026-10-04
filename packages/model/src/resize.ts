import type { Box } from './geometry';
import type { Element } from './schema';
import type { Point } from './viewport';

/**
 * Smallest width and height a resizable element can be reduced to (F07-S3-AC3).
 */
export const MIN_ELEMENT_SIZE = 40;

/**
 * Ids of the eight resize handles of a selection, in rendering order.
 */
export const RESIZE_HANDLE_ORDER = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const;

export type ResizeHandle = (typeof RESIZE_HANDLE_ORDER)[number];

const HANDLE_FACTORS: Record<ResizeHandle, { fx: number; fy: number }> = {
  nw: { fx: 0, fy: 0 },
  n: { fx: 0.5, fy: 0 },
  ne: { fx: 1, fy: 0 },
  w: { fx: 0, fy: 0.5 },
  e: { fx: 1, fy: 0.5 },
  sw: { fx: 0, fy: 1 },
  s: { fx: 0.5, fy: 1 },
  se: { fx: 1, fy: 1 },
};

/**
 * Tells whether an element has resize handles: arrows have two endpoint handles
 * (F06-S2) and free text follows its content (F05).
 */
export function isResizable(element: Element): boolean {
  return element.type === 'sticky' || element.type === 'rect' || element.type === 'ellipse';
}

/**
 * World position of a resize handle on a box.
 */
export function resizeHandlePoint(box: Box, handle: ResizeHandle): Point {
  const { fx, fy } = HANDLE_FACTORS[handle];
  return { x: box.x + box.width * fx, y: box.y + box.height * fy };
}

/**
 * Returns the resize handle of the box within `tolerance` of the world point, or
 * `undefined` when the point is not on a handle.
 */
export function resizeHandleAtPoint(
  box: Box,
  point: Point,
  tolerance: number,
): ResizeHandle | undefined {
  for (const handle of RESIZE_HANDLE_ORDER) {
    const position = resizeHandlePoint(box, handle);
    if (
      Math.abs(point.x - position.x) <= tolerance &&
      Math.abs(point.y - position.y) <= tolerance
    ) {
      return handle;
    }
  }
  return undefined;
}

export type ResizeOptions = {
  preserveAspectRatio?: boolean;
  minSize?: number;
};

function clampAspect(
  width: number,
  aspect: number,
  minSize: number,
): { width: number; height: number } {
  let clampedWidth = Math.max(width, minSize);
  let clampedHeight = clampedWidth / aspect;
  if (clampedHeight < minSize) {
    clampedHeight = minSize;
    clampedWidth = clampedHeight * aspect;
  }
  return { width: clampedWidth, height: clampedHeight };
}

/**
 * Computes the box produced by dragging a resize handle to a world point. The
 * edge or corner opposite the handle stays fixed (F07-S3-AC1); with
 * `preserveAspectRatio` the original width/height ratio is kept (F07-S3-AC2) and
 * the size never goes below `MIN_ELEMENT_SIZE` (F07-S3-AC3).
 */
export function resizeBox(
  box: Box,
  handle: ResizeHandle,
  pointer: Point,
  options: ResizeOptions = {},
): Box {
  const minSize = options.minSize ?? MIN_ELEMENT_SIZE;
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const movesLeft = handle.includes('w');
  const movesRight = handle.includes('e');
  const movesTop = handle.includes('n');
  const movesBottom = handle.includes('s');
  const anchorX = movesLeft ? right : box.x;
  const anchorY = movesTop ? bottom : box.y;

  let width = movesLeft ? anchorX - pointer.x : movesRight ? pointer.x - anchorX : box.width;
  let height = movesTop ? anchorY - pointer.y : movesBottom ? pointer.y - anchorY : box.height;

  if (options.preserveAspectRatio === true) {
    const aspect = box.width / box.height;
    if ((movesLeft || movesRight) && (movesTop || movesBottom)) {
      const scale = Math.max(width / box.width, height / box.height);
      width = box.width * scale;
      height = box.height * scale;
    } else if (movesLeft || movesRight) {
      width = Math.max(width, minSize);
      height = width / aspect;
    } else if (movesTop || movesBottom) {
      height = Math.max(height, minSize);
      width = height * aspect;
    }
    const clamped = clampAspect(width, aspect, minSize);
    width = clamped.width;
    height = clamped.height;
  }

  width = Math.max(width, minSize);
  height = Math.max(height, minSize);

  let x = box.x;
  let y = box.y;
  if (movesLeft) {
    x = anchorX - width;
  } else if (movesRight) {
    x = anchorX;
  } else {
    x = box.x + (box.width - width) / 2;
  }
  if (movesTop) {
    y = anchorY - height;
  } else if (movesBottom) {
    y = anchorY;
  } else {
    y = box.y + (box.height - height) / 2;
  }

  return { x, y, width, height };
}
