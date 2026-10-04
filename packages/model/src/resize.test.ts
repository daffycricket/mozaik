import { describe, expect, test } from 'vitest';
import {
  isResizable,
  MIN_ELEMENT_SIZE,
  resizeBox,
  resizeHandleAtPoint,
  resizeHandlePoint,
} from './resize';
import type { Element } from './schema';

describe('[F07-S3-AC1] resize box', () => {
  test('[F07-S3-AC1] drags the bottom-right handle while keeping the top-left corner fixed', () => {
    const next = resizeBox({ x: 10, y: 20, width: 100, height: 100 }, 'se', { x: 210, y: 180 });

    expect(next).toEqual({ x: 10, y: 20, width: 200, height: 160 });
  });

  test('[F07-S3-AC1] drags the top-left handle while keeping the bottom-right corner fixed', () => {
    const next = resizeBox({ x: 100, y: 100, width: 100, height: 100 }, 'nw', { x: 50, y: 40 });

    expect(next).toEqual({ x: 50, y: 40, width: 150, height: 160 });
  });

  test('[F07-S3-AC1] drags a side handle on a single axis', () => {
    const next = resizeBox({ x: 0, y: 0, width: 100, height: 100 }, 'e', { x: 150, y: 999 });

    expect(next).toEqual({ x: 0, y: 0, width: 150, height: 100 });
  });
});

describe('[F07-S3-AC2] resize proportions', () => {
  test('[F07-S3-AC2] keeps the width/height ratio with Shift on a corner handle', () => {
    const next = resizeBox(
      { x: 0, y: 0, width: 200, height: 100 },
      'se',
      { x: 400, y: 150 },
      { preserveAspectRatio: true },
    );

    expect(next.width / next.height).toBeCloseTo(2, 5);
    expect(next.width).toBe(400);
    expect(next.height).toBe(200);
  });

  test('[F07-S3-AC2] scales the other axis with Shift on a side handle', () => {
    const next = resizeBox(
      { x: 0, y: 0, width: 200, height: 100 },
      'e',
      { x: 400, y: 0 },
      { preserveAspectRatio: true },
    );

    expect(next.width / next.height).toBeCloseTo(2, 5);
    expect(next.width).toBe(400);
    expect(next.height).toBe(200);
    expect(next.y).toBe(-50);
  });
});

describe('[F07-S3-AC3] minimum size', () => {
  test('[F07-S3-AC3] clamps the size to the minimum when the pointer crosses the anchor', () => {
    const next = resizeBox({ x: 0, y: 0, width: 100, height: 100 }, 'se', { x: -50, y: -50 });

    expect(next).toEqual({ x: 0, y: 0, width: MIN_ELEMENT_SIZE, height: MIN_ELEMENT_SIZE });
  });

  test('[F07-S3-AC3] clamps the ratio while keeping it when Shift is held', () => {
    const next = resizeBox(
      { x: 0, y: 0, width: 200, height: 100 },
      'se',
      { x: -50, y: -50 },
      { preserveAspectRatio: true },
    );

    expect(next.width).toBe(MIN_ELEMENT_SIZE * 2);
    expect(next.height).toBe(MIN_ELEMENT_SIZE);
  });
});

describe('[F07-S3] resize handles', () => {
  test('[F07-S3] locates the handle under a world point within tolerance', () => {
    const box = { x: 0, y: 0, width: 100, height: 100 };

    expect(resizeHandleAtPoint(box, { x: 100, y: 100 }, 4)).toBe('se');
    expect(resizeHandleAtPoint(box, { x: 50, y: 0 }, 4)).toBe('n');
    expect(resizeHandleAtPoint(box, { x: 0, y: 0 }, 4)).toBe('nw');
    expect(resizeHandleAtPoint(box, { x: 200, y: 200 }, 4)).toBeUndefined();
  });

  test('[F07-S3] places the handles at the corners and side midpoints', () => {
    const box = { x: 10, y: 20, width: 100, height: 50 };

    expect(resizeHandlePoint(box, 'se')).toEqual({ x: 110, y: 70 });
    expect(resizeHandlePoint(box, 'n')).toEqual({ x: 60, y: 20 });
  });

  test('[F07-S3] only resizes shapes with a size, not text or arrows', () => {
    const base = { id: 'e', x: 0, y: 0, width: 10, height: 10, zIndex: 'a', createdBy: 'u' };
    const elements: Element[] = [
      { ...base, type: 'sticky', text: '', color: 'yellow' },
      { ...base, type: 'rect' },
      { ...base, type: 'ellipse' },
      { ...base, type: 'text', text: '', color: 'black' },
      { ...base, type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10 },
    ];

    expect(elements.filter(isResizable).map((element) => element.type)).toEqual([
      'sticky',
      'rect',
      'ellipse',
    ]);
  });
});
