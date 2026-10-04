import { STICKY_FONT_SIZE, STICKY_MIN_FONT_SIZE } from './schema';

const STICKY_PADDING = 8;
const LINE_HEIGHT_RATIO = 1.2;
const AVERAGE_CHAR_WIDTH_RATIO = 0.6;

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
