import { describe, expect, test } from 'vitest';
import {
  interpolatePoint,
  isPointVisible,
  parsePresenceState,
  USER_COLORS,
  userColor,
} from './presence';

describe('[F10-S2-AC1] user cursor color', () => {
  test('[F10-S2-AC1] derives a stable color from the identity id', () => {
    expect(userColor('cursor-nico')).toBe(userColor('cursor-nico'));
    expect(USER_COLORS).toContain(userColor('cursor-nico'));
  });

  test('[F10-S2-AC1] assigns distinct colors to distinct identities', () => {
    const colors = ['presence-a', 'presence-b', 'presence-c'].map(userColor);
    expect(new Set(colors).size).toBe(3);
  });

  test('[F10-S2-AC5] provides twelve contrasting colors', () => {
    expect(USER_COLORS).toHaveLength(12);
    expect(new Set(USER_COLORS).size).toBe(12);
  });
});

describe('[F10-S2-AC1] presence state validation', () => {
  test('[F10-S2-AC1] accepts a valid user and cursor', () => {
    expect(
      parsePresenceState({ user: { id: 'u', name: 'Nico L', color: '#E11D48' }, cursor: null }),
    ).toEqual({ user: { id: 'u', name: 'Nico L', color: '#E11D48' }, cursor: null });
    expect(
      parsePresenceState({
        user: { id: 'u', name: 'Nico L', color: '#E11D48' },
        cursor: { x: 1, y: 2 },
      })?.cursor,
    ).toEqual({ x: 1, y: 2 });
  });

  test('[F10-S2-AC1] rejects a state without a user', () => {
    expect(parsePresenceState({ cursor: { x: 1, y: 2 } })).toBeNull();
    expect(parsePresenceState(null)).toBeNull();
    expect(parsePresenceState({ user: { id: '', name: '', color: '' }, cursor: null })).toBeNull();
  });
});

describe('[F10-S2-AC3] cursor visibility', () => {
  test('[F10-S2-AC3] accepts a point inside the canvas and rejects the outside', () => {
    const size = { width: 1280, height: 752 };
    expect(isPointVisible({ x: 0, y: 0 }, size)).toBe(true);
    expect(isPointVisible({ x: 1280, y: 752 }, size)).toBe(true);
    expect(isPointVisible({ x: -1, y: 100 }, size)).toBe(false);
    expect(isPointVisible({ x: 100, y: 753 }, size)).toBe(false);
  });
});

describe('[F10-S2-AC2] cursor interpolation', () => {
  test('[F10-S2-AC2] interpolates between two received positions', () => {
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 2)).toEqual({ x: 10, y: 20 });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, -1)).toEqual({ x: 0, y: 0 });
  });
});
