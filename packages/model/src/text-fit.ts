import {
  STICKY_FONT_SIZE,
  STICKY_MIN_FONT_SIZE,
  TEXT_FONT_SIZE,
  TEXT_LINE_HEIGHT_RATIO,
  TEXT_MAX_WIDTH,
  TEXT_MIN_WIDTH,
} from './schema';

const STICKY_PADDING = 8;
const LINE_HEIGHT_RATIO = 1.2;
const AVERAGE_CHAR_WIDTH_RATIO = 0.6;

/**
 * Height of one line of a free text, in world units (F05).
 */
export const TEXT_LINE_HEIGHT = TEXT_FONT_SIZE * TEXT_LINE_HEIGHT_RATIO;

function wrappedLineCount(text: string, innerWidth: number, fontSize: number): number {
  const charsPerLine = Math.max(1, Math.floor(innerWidth / (fontSize * AVERAGE_CHAR_WIDTH_RATIO)));
  let lines = 0;
  for (const paragraph of text.split('\n')) {
    lines += Math.max(1, Math.ceil(paragraph.length / charsPerLine));
  }
  return lines;
}

/**
 * Largest font size, at 100 % zoom, at which the text fits inside the box
 * without going below `STICKY_MIN_FONT_SIZE` (F03-S2-AC4). The estimate is
 * intentionally simple: it feeds both the Konva rendering and the text editor,
 * so they stay consistent.
 */
export function fitStickyFontSize(text: string, box: { width: number; height: number }): number {
  const innerWidth = Math.max(1, box.width - STICKY_PADDING * 2);
  const innerHeight = Math.max(1, box.height - STICKY_PADDING * 2);
  for (let fontSize = STICKY_FONT_SIZE; fontSize > STICKY_MIN_FONT_SIZE; fontSize -= 1) {
    const lines = wrappedLineCount(text, innerWidth, fontSize);
    if (lines * fontSize * LINE_HEIGHT_RATIO <= innerHeight) {
      return fontSize;
    }
  }
  return STICKY_MIN_FONT_SIZE;
}

/**
 * Box of a free text at its fixed font size: the width follows the longest line
 * up to `TEXT_MAX_WIDTH`, then the text wraps, and the height follows the number
 * of lines (F05). The estimate feeds both the Konva rendering and the editor, so
 * they stay consistent.
 */
export function measureTextBox(text: string): { width: number; height: number } {
  const paragraphs = text.split('\n');
  const longest = paragraphs.reduce((max, line) => Math.max(max, line.length), 0);
  const width = Math.min(
    TEXT_MAX_WIDTH,
    Math.max(TEXT_MIN_WIDTH, longest * TEXT_FONT_SIZE * AVERAGE_CHAR_WIDTH_RATIO),
  );
  const lines = wrappedLineCount(text, width, TEXT_FONT_SIZE);
  return { width, height: lines * TEXT_LINE_HEIGHT };
}
