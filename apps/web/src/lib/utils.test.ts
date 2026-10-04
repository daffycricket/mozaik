import { describe, expect, test } from 'vitest';
import { cn } from './utils';

describe('[T-006-AC1] class name helper', () => {
  test('[T-006-AC1] joins truthy classes and drops falsy ones', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  test('[T-006-AC1] resolves conflicting Tailwind utilities', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
