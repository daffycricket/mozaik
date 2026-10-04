import { describe, expect, test } from 'vitest';
import { unionBounds } from './geometry';

describe('union bounds', () => {
  test('returns null without boxes', () => {
    expect(unionBounds([])).toBeNull();
  });

  test('returns the single box unchanged', () => {
    expect(unionBounds([{ x: 10, y: 20, width: 30, height: 40 }])).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  test('encloses several boxes', () => {
    expect(
      unionBounds([
        { x: 10, y: 20, width: 30, height: 40 },
        { x: -5, y: 60, width: 10, height: 10 },
      ]),
    ).toEqual({ x: -5, y: 20, width: 45, height: 50 });
  });
});
