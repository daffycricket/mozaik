import type { Box } from './geometry';

export type Point = { x: number; y: number };

/**
 * Visible part of the canvas: world position of the screen origin and zoom factor.
 */
export type Viewport = { x: number; y: number; zoom: number };

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 1.2;

/**
 * Margin kept between the fitted content and the edges of the canvas, in screen
 * pixels (F02-S4).
 */
export const FIT_PADDING = 48;

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

/**
 * Constrains a zoom factor to the allowed range.
 */
export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Viewport that centers `bounds` inside a canvas of the given size, with a
 * `FIT_PADDING` margin, zooming out when the content is larger than the
 * viewport (F02-S4-AC1). The zoom stays within `MIN_ZOOM`/`MAX_ZOOM`
 * (F02-S4-AC3). A null box or an unmeasured canvas returns the default
 * viewport (F02-S4-AC2).
 */
export function fitViewport(
  bounds: Box | null,
  canvas: { width: number; height: number },
): Viewport {
  if (bounds === null || canvas.width <= 0 || canvas.height <= 0) {
    return { ...DEFAULT_VIEWPORT };
  }
  const availableWidth = canvas.width - 2 * FIT_PADDING;
  const availableHeight = canvas.height - 2 * FIT_PADDING;
  const ratios: number[] = [];
  if (bounds.width > 0) {
    ratios.push(availableWidth / bounds.width);
  }
  if (bounds.height > 0) {
    ratios.push(availableHeight / bounds.height);
  }
  const zoom = clampZoom(ratios.length === 0 ? MAX_ZOOM : Math.min(...ratios));
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  return {
    x: center.x - canvas.width / 2 / zoom,
    y: center.y - canvas.height / 2 / zoom,
    zoom,
  };
}

/**
 * Sets the zoom while keeping the world point under `screenPoint` fixed on screen.
 */
export function zoomViewport(viewport: Viewport, zoom: number, screenPoint: Point): Viewport {
  const nextZoom = clampZoom(zoom);
  const world = screenToWorld(viewport, screenPoint);
  return {
    x: world.x - screenPoint.x / nextZoom,
    y: world.y - screenPoint.y / nextZoom,
    zoom: nextZoom,
  };
}
