import { describe, expect, test } from 'vitest';
import { collabUrl } from './collab-url';

describe('[T-003-AC3] collaboration URL', () => {
  test('[T-003-AC3] targets the /collab path on the current origin', () => {
    expect(collabUrl({ protocol: 'http:', host: '127.0.0.1:5173' })).toBe(
      'ws://127.0.0.1:5173/collab',
    );
  });

  test('[T-003-AC3] uses the secure scheme over HTTPS', () => {
    expect(collabUrl({ protocol: 'https:', host: 'mozaik.local' })).toBe(
      'wss://mozaik.local/collab',
    );
  });
});
