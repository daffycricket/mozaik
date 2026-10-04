import { describe, expect, test } from 'vitest';
import { MODEL_SCHEMA_VERSION } from './index';

describe('[T-001-AC5] @mozaik/model unit test', () => {
  test('[T-001-AC5] exposes the board document schema version', () => {
    expect(MODEL_SCHEMA_VERSION).toBe(1);
  });
});
