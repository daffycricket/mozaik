import { describe, expect, test } from 'vitest';
import { formatRelativeDate } from './relative-date';

const NOW = new Date('2026-10-04T12:00:00');

describe('formatRelativeDate', () => {
  test('returns "à l\'instant" for less than a minute', () => {
    expect(formatRelativeDate('2026-10-04T11:59:30', NOW)).toBe("à l'instant");
  });

  test('returns minutes under an hour', () => {
    expect(formatRelativeDate('2026-10-04T11:35:00', NOW)).toBe('il y a 25 min');
  });

  test('returns hours under a day', () => {
    expect(formatRelativeDate('2026-10-04T09:00:00', NOW)).toBe('il y a 3 h');
  });

  test('returns "hier" for the previous calendar day', () => {
    expect(formatRelativeDate('2026-10-03T09:00:00', NOW)).toBe('hier');
  });

  test('returns a day/month date beyond yesterday', () => {
    expect(formatRelativeDate('2026-09-28T09:00:00', NOW)).toBe('le 28/09');
  });
});
