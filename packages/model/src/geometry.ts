export type Box = { x: number; y: number; width: number; height: number };

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
