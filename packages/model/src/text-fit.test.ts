import { describe, expect, test } from 'vitest';
import { STICKY_FONT_SIZE, STICKY_MIN_FONT_SIZE, TEXT_MAX_WIDTH } from './schema';
import { fitStickyFontSize, measureTextBox, TEXT_LINE_HEIGHT } from './text-fit';

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

describe('[F05-S1-AC3] free text measurement', () => {
  test('[F05-S1-AC3] makes the height match the number of lines', () => {
    expect(measureTextBox('a\nb\nc').height).toBe(3 * TEXT_LINE_HEIGHT);
    expect(measureTextBox('a').height).toBe(TEXT_LINE_HEIGHT);
  });

  test('[F05-S1-AC3] widens with the longest line up to the maximum', () => {
    expect(measureTextBox('ab').width).toBeLessThan(measureTextBox('abcdefgh').width);
    expect(measureTextBox('a'.repeat(200)).width).toBe(TEXT_MAX_WIDTH);
  });

  test('[F05-S1-AC3] wraps a text wider than the maximum and grows in height', () => {
    const wrapped = measureTextBox('a'.repeat(200));

    expect(wrapped.width).toBe(TEXT_MAX_WIDTH);
    expect(wrapped.height).toBeGreaterThan(TEXT_LINE_HEIGHT);
  });

  test('[F05-S1-AC3] keeps a minimum width and one line for an empty text', () => {
    const empty = measureTextBox('');

    expect(empty.width).toBeGreaterThan(0);
    expect(empty.height).toBe(TEXT_LINE_HEIGHT);
  });
});
