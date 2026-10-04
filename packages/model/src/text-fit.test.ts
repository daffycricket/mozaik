import { describe, expect, test } from 'vitest';
import { STICKY_FONT_SIZE, STICKY_MIN_FONT_SIZE } from './schema';
import { fitStickyFontSize } from './text-fit';

const BOX = { width: 200, height: 200 };

describe('[F03-S2-AC4] sticky font size fitting', () => {
  test('[F03-S2-AC4] keeps the base size for a short text', () => {
    expect(fitStickyFontSize('Idée 1', BOX)).toBe(STICKY_FONT_SIZE);
    expect(fitStickyFontSize('', BOX)).toBe(STICKY_FONT_SIZE);
  });

  test('[F03-S2-AC4] shrinks the font for a text that overflows at the base size', () => {
    const fontSize = fitStickyFontSize('a'.repeat(150), BOX);

    expect(fontSize).toBeLessThan(STICKY_FONT_SIZE);
    expect(fontSize).toBeGreaterThanOrEqual(STICKY_MIN_FONT_SIZE);
  });

  test('[F03-S2-AC4] never goes below the minimum size', () => {
    expect(fitStickyFontSize('a'.repeat(2000), BOX)).toBe(STICKY_MIN_FONT_SIZE);
    expect(fitStickyFontSize('ligne\n'.repeat(500), BOX)).toBe(STICKY_MIN_FONT_SIZE);
  });
});
