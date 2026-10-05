import {
  ARROW_MIN_LENGTH,
  SHAPE_DEFAULT_HEIGHT,
  SHAPE_DEFAULT_WIDTH,
  SHAPE_MIN_SIZE,
} from './schema';
import type { Point } from './viewport';

export type Box = { x: number; y: number; width: number; height: number };

export type ArrowPoints = { x1: number; y1: number; x2: number; y2: number };

export type ArrowEndpoint = 'start' | 'end';

/**
 * Endpoints of an arrow dragged from `start` to `end`, or `null` when the drag
 * is shorter than `ARROW_MIN_LENGTH` (F06-S1-AC1, AC2).
 */
export function arrowFromDrag(start: Point, end: Point): ArrowPoints | null {
  if (Math.hypot(end.x - start.x, end.y - start.y) < ARROW_MIN_LENGTH) {
    return null;
  }
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

/**
 * Distance from `point` to the segment `[a, b]`, used to hit-test the body of an
 * arrow instead of its bounding box (F06-S2-AC2).
 */
export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/**
 * Endpoint of an arrow within `tolerance` of the world point, or `undefined`
 * when the point is not on one of the two handles (F06-S2-AC1).
 */
export function arrowEndpointAtPoint(
  arrow: ArrowPoints,
  point: Point,
  tolerance: number,
): ArrowEndpoint | undefined {
  if (Math.hypot(point.x - arrow.x1, point.y - arrow.y1) <= tolerance) {
    return 'start';
  }
  if (Math.hypot(point.x - arrow.x2, point.y - arrow.y2) <= tolerance) {
    return 'end';
  }
  return undefined;
}

/**
 * Arrow endpoints after moving one endpoint to `point`, the other staying fixed
 * (F06-S2-AC1).
 */
export function arrowWithEndpointMoved(
  arrow: ArrowPoints,
  endpoint: ArrowEndpoint,
  point: Point,
): ArrowPoints {
  return endpoint === 'start'
    ? { ...arrow, x1: point.x, y1: point.y }
    : { ...arrow, x2: point.x, y2: point.y };
}

/**
 * Normalized box spanning two points, used for the selection rectangle dragged
 * from an empty area (F07-S1-AC3).
 */
export function boxFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/**
 * Box of a shape dragged from `start` to `end`. The box is normalized to a
 * positive width and height so it covers the dragged area in every direction
 * (F04-S1-AC1, AC2), never smaller than `SHAPE_MIN_SIZE`, and squared when
 * `square` is set, to draw a circle from an ellipse drag (F04-S1-AC4).
 */
export function shapeBoxFromDrag(
  start: Point,
  end: Point,
  options: { square?: boolean } = {},
): Box {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let width = Math.max(Math.abs(dx), SHAPE_MIN_SIZE);
  let height = Math.max(Math.abs(dy), SHAPE_MIN_SIZE);
  if (options.square === true) {
    const side = Math.max(width, height);
    width = side;
    height = side;
  }
  return {
    x: dx < 0 ? start.x - width : start.x,
    y: dy < 0 ? start.y - height : start.y,
    width,
    height,
  };
}

/**
 * Box of a shape created by a simple click, centered on `center`
 * (F04-S1-AC3).
 */
export function defaultShapeBox(center: Point): Box {
  return {
    x: center.x - SHAPE_DEFAULT_WIDTH / 2,
    y: center.y - SHAPE_DEFAULT_HEIGHT / 2,
    width: SHAPE_DEFAULT_WIDTH,
    height: SHAPE_DEFAULT_HEIGHT,
  };
}

/**
 * Bounding box of a set of boxes, or `null` when the set is empty. Used to draw
 * the selection frame around one or several elements (F07).
 */
export function unionBounds(boxes: Box[]): Box | null {
  if (boxes.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const box of boxes) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
