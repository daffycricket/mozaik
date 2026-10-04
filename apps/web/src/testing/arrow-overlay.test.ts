import { describe, expect, test } from 'vitest';
import { computeOverlayBoxes } from './board-api';

describe('[UI-BOARD-10] arrow selection overlay', () => {
  test('[UI-BOARD-10] shows two round handles and no frame for a single arrow', () => {
    const boxes = computeOverlayBoxes({
      viewport: { x: 0, y: 0, zoom: 2 },
      selection: null,
      cursors: [],
      arrow: { from: { x: 10, y: 20 }, to: { x: 110, y: 70 } },
    });

    expect(boxes.selection).toBeNull();
    expect(boxes.handles).toEqual([
      { x: 16, y: 36, width: 8, height: 8 },
      { x: 216, y: 136, width: 8, height: 8 },
    ]);
  });
});
