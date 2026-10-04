import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import { arrowFromDrag } from './geometry';
import { createArrow, createSticky, getElement, LOCAL_ORIGIN, moveElements } from './ops';
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
