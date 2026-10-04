export type Point = { x: number; y: number };

/**
 * Visible part of the canvas: world position of the screen origin and zoom factor.
 */
export type Viewport = { x: number; y: number; zoom: number };

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

/**
 * Converts a world coordinate into a screen coordinate for the given viewport.
 */
export function worldToScreen(viewport: Viewport, point: Point): Point {
  return {
    x: (point.x - viewport.x) * viewport.zoom,
    y: (point.y - viewport.y) * viewport.zoom,
  };
}

/**
 * Converts a screen coordinate into a world coordinate for the given viewport.
 */
export function screenToWorld(viewport: Viewport, point: Point): Point {
  return {
    x: point.x / viewport.zoom + viewport.x,
    y: point.y / viewport.zoom + viewport.y,
  };
}

/**
 * Moves the viewport by a screen-space delta so the content follows the pointer:
 * a positive delta (drag to the right) decreases the world origin of the screen.
 */
export function panViewport(viewport: Viewport, screenDelta: Point): Viewport {
  return {
    x: viewport.x - screenDelta.x / viewport.zoom,
    y: viewport.y - screenDelta.y / viewport.zoom,
    zoom: viewport.zoom,
  };
}
