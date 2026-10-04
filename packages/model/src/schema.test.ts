import { describe, expect, test } from 'vitest';
import {
  ELEMENT_TYPES,
  elementSchema,
  MODEL_SCHEMA_VERSION,
  PALETTE,
  PALETTE_COLORS,
  paletteColorSchema,
} from './schema';

describe('[T-003-AC1] element schema', () => {
  test('[T-003-AC1] declares the ten palette colours of the design reference', () => {
    expect(PALETTE_COLORS).toHaveLength(10);
    expect(Object.keys(PALETTE)).toEqual([...PALETTE_COLORS]);
    expect(PALETTE.yellow).toEqual({ background: '#FFE58F', text: '#8A6D00' });
    expect(PALETTE.black).toEqual({ background: '#4B5563', text: '#111827' });
    for (const color of PALETTE_COLORS) {
      expect(PALETTE[color].background).toMatch(/^#[0-9A-F]{6}$/);
      expect(PALETTE[color].text).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(paletteColorSchema.safeParse('teal').success).toBe(true);
    expect(paletteColorSchema.safeParse('chartreuse').success).toBe(false);
  });

  test('[T-003-AC1] accepts every element type with its specific fields', () => {
    expect(ELEMENT_TYPES).toEqual(['sticky', 'rect', 'ellipse', 'text', 'arrow']);
    const base = {
      id: 'e1',
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      zIndex: 'a0',
      createdBy: 'user',
    };
    expect(
      elementSchema.safeParse({ ...base, type: 'sticky', text: '', color: 'yellow' }).success,
    ).toBe(true);
    expect(elementSchema.safeParse({ ...base, type: 'rect' }).success).toBe(true);
    expect(elementSchema.safeParse({ ...base, type: 'ellipse' }).success).toBe(true);
    expect(
      elementSchema.safeParse({ ...base, type: 'text', text: 'hi', color: 'black' }).success,
    ).toBe(true);
    expect(
      elementSchema.safeParse({ ...base, type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 5 }).success,
    ).toBe(true);
  });

  test('[T-003-AC1] rejects malformed elements', () => {
    expect(elementSchema.safeParse({ type: 'sticky' }).success).toBe(false);
    expect(
      elementSchema.safeParse({
        id: 'e1',
        type: 'sticky',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        zIndex: 'a0',
        createdBy: 'user',
        text: '',
        color: 'chartreuse',
      }).success,
    ).toBe(false);
    expect(
      elementSchema.safeParse({
        id: 'e1',
        type: 'rect',
        x: 0,
        y: 0,
        width: -1,
        height: 10,
        zIndex: 'a0',
        createdBy: 'user',
      }).success,
    ).toBe(false);
  });

  test('[T-003-AC1] exposes the schema version', () => {
    expect(MODEL_SCHEMA_VERSION).toBe(1);
  });
});
