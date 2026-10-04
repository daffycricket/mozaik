import { describe, expect, test } from 'vitest';
import { HANDLE_SIZE, selectionHandles } from './selection-handles';

describe('[UI-BOARD-10] selection handles', () => {
  test('[UI-BOARD-10] places eight handles at the corners and side midpoints', () => {
    const handles = selectionHandles({ x: 0, y: 0, width: 100, height: 50 });

    expect(HANDLE_SIZE).toBe(8);
    expect(handles).toHaveLength(8);
    expect(handles.map(({ x, y }) => ({ x, y }))).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 25 },
        { x: 100, y: 25 },
        { x: 0, y: 50 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ]),
    );
    expect(new Set(handles.map((handle) => handle.id)).size).toBe(8);
  });
});
