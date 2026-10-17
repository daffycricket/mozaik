import { describe, expect, test } from 'vitest';
import type { Box } from './geometry';
import {
  DEFAULT_VIEWPORT,
  FIT_PADDING,
  fitViewport,
  MAX_ZOOM,
  MIN_ZOOM,
  type Viewport,
  worldToScreen,
} from './viewport';

const CANVAS = { width: 800, height: 600 };
const EPSILON = 1e-6;

function screenBox(bounds: Box, viewport: Viewport): Box {
  const topLeft = worldToScreen(viewport, { x: bounds.x, y: bounds.y });
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bounds.width * viewport.zoom,
    height: bounds.height * viewport.zoom,
  };
}

describe('[F02-S4-AC1] fit viewport', () => {
  test('[F02-S4-AC1] centers content smaller than the canvas with the fit padding', () => {
    const bounds: Box = { x: 0, y: 0, width: 200, height: 200 };

    const viewport = fitViewport(bounds, CANVAS);
    const box = screenBox(bounds, viewport);

    expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
    expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
    expect(box.x + box.width).toBeLessThanOrEqual(CANVAS.width - FIT_PADDING + EPSILON);
    expect(box.y + box.height).toBeLessThanOrEqual(CANVAS.height - FIT_PADDING + EPSILON);
    expect(box.x + box.width / 2).toBeCloseTo(CANVAS.width / 2, 6);
    expect(box.y + box.height / 2).toBeCloseTo(CANVAS.height / 2, 6);
  });

  test('[F02-S4-AC1] zooms out so content larger than the viewport is fully visible', () => {
    const bounds: Box = { x: -500, y: -300, width: 2000, height: 1000 };

    const viewport = fitViewport(bounds, CANVAS);
    const box = screenBox(bounds, viewport);

    expect(viewport.zoom).toBeLessThan(1);
    expect(box.x).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
    expect(box.y).toBeGreaterThanOrEqual(FIT_PADDING - EPSILON);
    expect(box.x + box.width).toBeLessThanOrEqual(CANVAS.width - FIT_PADDING + EPSILON);
    expect(box.y + box.height).toBeLessThanOrEqual(CANVAS.height - FIT_PADDING + EPSILON);
    expect(box.x + box.width / 2).toBeCloseTo(CANVAS.width / 2, 6);
    expect(box.y + box.height / 2).toBeCloseTo(CANVAS.height / 2, 6);
  });
});

describe('[F02-S4-AC2] empty content', () => {
  test('[F02-S4-AC2] returns the default viewport for a null box', () => {
    expect(fitViewport(null, CANVAS)).toEqual(DEFAULT_VIEWPORT);
  });

  test('[F02-S4-AC2] returns the default viewport when the canvas is not measured', () => {
    const bounds: Box = { x: 0, y: 0, width: 100, height: 100 };
    expect(fitViewport(bounds, { width: 0, height: 0 })).toEqual(DEFAULT_VIEWPORT);
  });
});

describe('[F02-S4-AC3] fit zoom bounds', () => {
  test('[F02-S4-AC3] clamps a fit below the minimum zoom and keeps the content centered', () => {
    const bounds: Box = { x: 1000, y: 2000, width: 100000, height: 50000 };

    const viewport = fitViewport(bounds, CANVAS);
    const center = worldToScreen(viewport, { x: 51000, y: 27000 });

    expect(viewport.zoom).toBe(MIN_ZOOM);
    expect(center.x).toBeCloseTo(CANVAS.width / 2, 6);
    expect(center.y).toBeCloseTo(CANVAS.height / 2, 6);
  });

  test('[F02-S4-AC3] clamps a fit above the maximum zoom and keeps the content centered', () => {
    const bounds: Box = { x: -10, y: -10, width: 20, height: 20 };

    const viewport = fitViewport(bounds, CANVAS);
    const center = worldToScreen(viewport, { x: 0, y: 0 });

    expect(viewport.zoom).toBe(MAX_ZOOM);
    expect(center.x).toBeCloseTo(CANVAS.width / 2, 6);
    expect(center.y).toBeCloseTo(CANVAS.height / 2, 6);
  });

  test('[F02-S4-AC3] treats a zero-size axis as non-constraining', () => {
    const bounds: Box = { x: 0, y: 0, width: 200, height: 0 };

    const viewport = fitViewport(bounds, CANVAS);
    const box = screenBox(bounds, viewport);

    expect(Number.isFinite(viewport.zoom)).toBe(true);
    expect(box.x).toBeCloseTo(FIT_PADDING, 6);
    expect(box.x + box.width).toBeCloseTo(CANVAS.width - FIT_PADDING, 6);
    expect(box.y + box.height / 2).toBeCloseTo(CANVAS.height / 2, 6);
  });
});
