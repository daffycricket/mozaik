import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import { defaultShapeBox, shapeBoxFromDrag } from './geometry';
import { createShape, getElement, LOCAL_ORIGIN } from './ops';
import { SHAPE_DEFAULT_HEIGHT, SHAPE_DEFAULT_WIDTH, SHAPE_MIN_SIZE } from './schema';

describe('[F04-S1-AC1] shape drag box', () => {
  test('[F04-S1-AC1] spans the two opposite corners of the drag', () => {
    expect(shapeBoxFromDrag({ x: 10, y: 20 }, { x: 110, y: 70 })).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });
});

describe('[F04-S1-AC2] shape drag in every direction', () => {
  test('[F04-S1-AC2] keeps positive dimensions when dragging right to left', () => {
    expect(shapeBoxFromDrag({ x: 110, y: 70 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  test('[F04-S1-AC2] keeps positive dimensions when dragging bottom to top', () => {
    expect(shapeBoxFromDrag({ x: 10, y: 70 }, { x: 110, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  test('[F04-S1-AC2] clamps a tiny drag to the minimum shape size', () => {
    expect(shapeBoxFromDrag({ x: 50, y: 50 }, { x: 52, y: 53 })).toEqual({
      x: 50,
      y: 50,
      width: SHAPE_MIN_SIZE,
      height: SHAPE_MIN_SIZE,
    });
  });
});

describe('[F04-S1-AC3] shape simple click', () => {
  test('[F04-S1-AC3] centers the default size on the click point', () => {
    expect(defaultShapeBox({ x: 500, y: 300 })).toEqual({
      x: 500 - SHAPE_DEFAULT_WIDTH / 2,
      y: 300 - SHAPE_DEFAULT_HEIGHT / 2,
      width: SHAPE_DEFAULT_WIDTH,
      height: SHAPE_DEFAULT_HEIGHT,
    });
  });
});

describe('[F04-S1-AC4] ellipse with Shift', () => {
  test('[F04-S1-AC4] squares the box to draw a circle', () => {
    expect(shapeBoxFromDrag({ x: 0, y: 0 }, { x: 120, y: 40 }, { square: true })).toEqual({
      x: 0,
      y: 0,
      width: 120,
      height: 120,
    });
  });

  test('[F04-S1-AC4] keeps the drag direction when squaring', () => {
    expect(shapeBoxFromDrag({ x: 0, y: 0 }, { x: -40, y: -120 }, { square: true })).toEqual({
      x: -120,
      y: -120,
      width: 120,
      height: 120,
    });
  });
});

describe('[F04-S1-AC1] shape creation', () => {
  test('[F04-S1-AC1] creates a rectangle covering the given box in a local transaction', () => {
    const doc = createBoardDoc();
    const origins: unknown[] = [];
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });

    const rect = createShape(
      doc,
      'rect',
      { x: 10, y: 20, width: 100, height: 50 },
      { id: 'r1', createdBy: 'u' },
    );

    expect(rect).toMatchObject({ id: 'r1', type: 'rect', x: 10, y: 20, width: 100, height: 50 });
    expect(getElement(doc, 'r1')).toEqual(rect);
    expect(origins).toEqual([LOCAL_ORIGIN]);
    doc.destroy();
  });

  test('[F04-S1-AC4] creates an ellipse', () => {
    const doc = createBoardDoc();
    const ellipse = createShape(
      doc,
      'ellipse',
      { x: 0, y: 0, width: 60, height: 60 },
      { id: 'o1', createdBy: 'u' },
    );

    expect(ellipse).toMatchObject({ type: 'ellipse', width: 60, height: 60 });
    doc.destroy();
  });
});
