import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import { createSticky, getElement } from './ops';
import { STICKY_DEFAULT_SIZE, stickyTextColor } from './schema';

describe('[F03-S1-AC1] sticky creation', () => {
  test('[F03-S1-AC1] centers a 200x200 yellow sticky on the given point', () => {
    const doc = createBoardDoc();
    const sticky = createSticky(doc, { x: 500, y: 300 }, { id: 's1', createdBy: 'user-1' });

    expect(sticky).toMatchObject({
      id: 's1',
      type: 'sticky',
      x: 500 - STICKY_DEFAULT_SIZE / 2,
      y: 300 - STICKY_DEFAULT_SIZE / 2,
      width: STICKY_DEFAULT_SIZE,
      height: STICKY_DEFAULT_SIZE,
      color: 'yellow',
      text: '',
      createdBy: 'user-1',
    });
    expect(getElement(doc, 's1')).toEqual(sticky);
    doc.destroy();
  });
});

describe('[F03-S1-AC3] sticky stacking', () => {
  test('[F03-S1-AC3] places a new sticky above the existing elements', () => {
    const doc = createBoardDoc();
    const first = createSticky(doc, { x: 0, y: 0 }, { id: 's1', createdBy: 'u' });
    const second = createSticky(doc, { x: 0, y: 0 }, { id: 's2', createdBy: 'u' });

    expect(second.zIndex > first.zIndex).toBe(true);
    doc.destroy();
  });
});

describe('sticky text colour', () => {
  test('uses a dark text on every colour except black', () => {
    expect(stickyTextColor('yellow')).toBe('#111827');
    expect(stickyTextColor('blue')).toBe('#111827');
  });

  test('uses a white text on a black sticky note', () => {
    expect(stickyTextColor('black')).toBe('#FFFFFF');
  });
});
