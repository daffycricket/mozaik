import { z } from 'zod';

/**
 * Version of the shared board document schema.
 */
export const MODEL_SCHEMA_VERSION = 1;

/**
 * Fixed palette shared by sticky notes (background) and free text (text colour).
 */
export const PALETTE = {
  yellow: { background: '#FFE58F', text: '#8A6D00' },
  orange: { background: '#FFC58F', text: '#B45309' },
  red: { background: '#FFA8A8', text: '#C62828' },
  pink: { background: '#FFB3D9', text: '#AD1457' },
  purple: { background: '#D7B8FF', text: '#6A1B9A' },
  blue: { background: '#A8D1FF', text: '#1565C0' },
  teal: { background: '#9EE6DC', text: '#00695C' },
  green: { background: '#B6E8A8', text: '#2E7D32' },
  gray: { background: '#E0E0E0', text: '#4B5563' },
  black: { background: '#4B5563', text: '#111827' },
} as const;

export const PALETTE_COLORS = [
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'teal',
  'green',
  'gray',
  'black',
] as const;

export const paletteColorSchema = z.enum(PALETTE_COLORS);
export type PaletteColor = z.infer<typeof paletteColorSchema>;

/**
 * Default size of a sticky note, in world units (F03).
 */
export const STICKY_DEFAULT_SIZE = 200;

/**
 * Default font size of a sticky note at 100 % zoom (F03).
 */
export const STICKY_FONT_SIZE = 20;

/**
 * Smallest font size a sticky note text can be reduced to at 100 % zoom (F03).
 */
export const STICKY_MIN_FONT_SIZE = 10;

/**
 * Maximum length of a sticky note text, in characters (F03).
 */
export const STICKY_TEXT_MAX_LENGTH = 2000;

const STICKY_TEXT_COLOR = '#111827';
const STICKY_TEXT_COLOR_ON_BLACK = '#FFFFFF';

/**
 * Text colour of a sticky note: dark by default, white on a black note so the
 * contrast stays readable (F03).
 */
export function stickyTextColor(color: PaletteColor): string {
  return color === 'black' ? STICKY_TEXT_COLOR_ON_BLACK : STICKY_TEXT_COLOR;
}

/**
 * Fixed font size of a free text at 100 % zoom (F05).
 */
export const TEXT_FONT_SIZE = 20;

/**
 * Maximum width of a free text, in world units, before it wraps (F05).
 */
export const TEXT_MAX_WIDTH = 600;

/**
 * Width of an empty free text, in world units, so its editor stays usable (F05).
 */
export const TEXT_MIN_WIDTH = 20;

/**
 * Line height multiplier of a free text (F05).
 */
export const TEXT_LINE_HEIGHT_RATIO = 1.2;

/**
 * Default size of a shape created by a simple click (F04-S1-AC3).
 */
export const SHAPE_DEFAULT_WIDTH = 160;
export const SHAPE_DEFAULT_HEIGHT = 100;

/**
 * Smallest width and height of a shape, in world units (F04).
 */
export const SHAPE_MIN_SIZE = 10;

/**
 * Fixed outline style of the shapes: the fill stays transparent and the style is
 * not user-modifiable (F04).
 */
export const SHAPE_STROKE = '#1f2937';
export const SHAPE_STROKE_WIDTH = 2;

export const ELEMENT_TYPES = ['sticky', 'rect', 'ellipse', 'text', 'arrow'] as const;
export const elementTypeSchema = z.enum(ELEMENT_TYPES);
export type ElementType = z.infer<typeof elementTypeSchema>;

export const SHAPE_TYPES = ['rect', 'ellipse'] as const;
export const shapeTypeSchema = z.enum(SHAPE_TYPES);
export type ShapeType = z.infer<typeof shapeTypeSchema>;

const baseElementShape = {
  id: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
  zIndex: z.string().min(1),
  createdBy: z.string().min(1),
};

export const stickyElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('sticky'),
  text: z.string(),
  color: paletteColorSchema,
});

export const rectElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('rect'),
});

export const ellipseElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('ellipse'),
});

export const textElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('text'),
  text: z.string(),
  color: paletteColorSchema,
});

export const arrowElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('arrow'),
  x1: z.number().finite(),
  y1: z.number().finite(),
  x2: z.number().finite(),
  y2: z.number().finite(),
});

export const elementSchema = z.discriminatedUnion('type', [
  stickyElementSchema,
  rectElementSchema,
  ellipseElementSchema,
  textElementSchema,
  arrowElementSchema,
]);

export type Element = z.infer<typeof elementSchema>;
export type StickyElement = z.infer<typeof stickyElementSchema>;
export type RectElement = z.infer<typeof rectElementSchema>;
export type EllipseElement = z.infer<typeof ellipseElementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type ArrowElement = z.infer<typeof arrowElementSchema>;
