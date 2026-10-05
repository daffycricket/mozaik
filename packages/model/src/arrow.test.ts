import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import {
  arrowEndpointAtPoint,
  arrowFromDrag,
  arrowWithEndpointMoved,
  distanceToSegment,
} from './geometry';
import {
  createArrow,
  createSticky,
  elementAtPoint,
  getElement,
  getElements,
  LOCAL_ORIGIN,
  moveElements,
  updateElement,
} from './ops';
import { ARROW_MIN_LENGTH } from './schema';

describe('[F06-S1-AC1] arrow drag endpoints', () => {
  test('[F06-S1-AC1] keeps the start and the end points of the drag', () => {
    expect(arrowFromDrag({ x: 10, y: 20 }, { x: 110, y: 70 })).toEqual({
      x1: 10,
      y1: 20,
      x2: 110,
      y2: 70,
    });
  });
});

describe('[F06-S1-AC2] too short arrow drag', () => {
  test('[F06-S1-AC2] rejects a drag shorter than the minimum length', () => {
    expect(ARROW_MIN_LENGTH).toBe(10);
    expect(arrowFromDrag({ x: 0, y: 0 }, { x: 6, y: 0 })).toBeNull();
    expect(arrowFromDrag({ x: 0, y: 0 }, { x: 6, y: 6 })).toBeNull();
  });
});

describe('[F06-S1-AC1] arrow creation', () => {
  test('[F06-S1-AC1] creates a free arrow in a local transaction', () => {
    const doc = createBoardDoc();
    const origins: unknown[] = [];
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });

    const arrow = createArrow(doc, { x: 1, y: 2 }, { x: 31, y: 42 }, { id: 'a1', createdBy: 'u' });

    expect(arrow).toMatchObject({
      id: 'a1',
      type: 'arrow',
      x1: 1,
      y1: 2,
      x2: 31,
      y2: 42,
      x: 1,
      y: 2,
      width: 30,
      height: 40,
    });
    expect(getElement(doc, 'a1')).toEqual(arrow);
    expect(origins).toEqual([LOCAL_ORIGIN]);
    doc.destroy();
  });
});

describe('[F06-S1-AC3] arrow independence', () => {
  test('[F06-S1-AC3] moving a sticky note leaves the arrow in place', () => {
    const doc = createBoardDoc();
    createSticky(doc, { x: 50, y: 50 }, { id: 's1', createdBy: 'u' });
    const arrow = createArrow(
      doc,
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { id: 'a1', createdBy: 'u' },
    );

    moveElements(doc, ['s1'], { x: 40, y: 25 });

    expect(getElement(doc, 'a1')).toEqual(arrow);
    doc.destroy();
  });
});

describe('[F06-S2-AC1] arrow endpoint editing', () => {
  test('[F06-S2-AC1] moves only the dragged endpoint', () => {
    const arrow = { x1: 0, y1: 0, x2: 100, y2: 50 };

    expect(arrowWithEndpointMoved(arrow, 'end', { x: 200, y: 80 })).toEqual({
      x1: 0,
      y1: 0,
      x2: 200,
      y2: 80,
    });
    expect(arrowWithEndpointMoved(arrow, 'start', { x: -10, y: -20 })).toEqual({
      x1: -10,
      y1: -20,
      x2: 100,
      y2: 50,
    });
  });

  test('[F06-S2-AC1] detects the endpoint under a point within tolerance', () => {
    const arrow = { x1: 0, y1: 0, x2: 100, y2: 0 };

    expect(arrowEndpointAtPoint(arrow, { x: 3, y: 3 }, 5)).toBe('start');
    expect(arrowEndpointAtPoint(arrow, { x: 98, y: 2 }, 5)).toBe('end');
    expect(arrowEndpointAtPoint(arrow, { x: 50, y: 0 }, 5)).toBeUndefined();
    expect(arrowEndpointAtPoint(arrow, { x: 10, y: 0 }, 5)).toBeUndefined();
  });

  test('[F06-S2-AC1] writes the moved endpoint in a local transaction', () => {
    const doc = createBoardDoc();
    createArrow(doc, { x: 0, y: 0 }, { x: 100, y: 0 }, { id: 'a1', createdBy: 'u' });
    const origins: unknown[] = [];
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });

    updateElement(
      doc,
      'a1',
      arrowWithEndpointMoved({ x1: 0, y1: 0, x2: 100, y2: 0 }, 'end', { x: 150, y: 60 }),
    );

    expect(getElement(doc, 'a1')).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 150,
      y2: 60,
      x: 0,
      y: 0,
      width: 150,
      height: 60,
    });
    expect(origins).toEqual([LOCAL_ORIGIN]);
    doc.destroy();
  });
});

describe('[F06-S2-AC2] arrow body editing', () => {
  test('[F06-S2-AC2] hits an arrow near its segment, not in the empty corners of its box', () => {
    const doc = createBoardDoc();
    createArrow(doc, { x: 0, y: 0 }, { x: 100, y: 100 }, { id: 'a1', createdBy: 'u' });
    const elements = getElements(doc);

    expect(elementAtPoint(elements, { x: 50, y: 50 }, { tolerance: 5 })?.id).toBe('a1');
    expect(elementAtPoint(elements, { x: 90, y: 10 }, { tolerance: 5 })).toBeUndefined();
    doc.destroy();
  });

  test('[F06-S2-AC2] moves both endpoints by the same vector', () => {
    const doc = createBoardDoc();
    createArrow(doc, { x: 10, y: 20 }, { x: 110, y: 70 }, { id: 'a1', createdBy: 'u' });

    moveElements(doc, ['a1'], { x: 30, y: -5 });

    expect(getElement(doc, 'a1')).toMatchObject({
      x1: 40,
      y1: 15,
      x2: 140,
      y2: 65,
      x: 40,
      y: 15,
      width: 100,
      height: 50,
    });
    doc.destroy();
  });

  test('[F06-S2-AC2] measures the distance from a point to a segment', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
    expect(distanceToSegment({ x: -4, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(4);
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
});
