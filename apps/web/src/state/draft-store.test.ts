import { describe, expect, test } from 'vitest';
import { useDraftStore } from './draft-store';

describe('[F04-S1-AC5] shape draft preview', () => {
  test('[F04-S1-AC5] stores and clears the previewed shape', () => {
    expect(useDraftStore.getState().draft).toBeNull();

    useDraftStore.getState().setDraft({
      type: 'ellipse',
      box: { x: 1, y: 2, width: 3, height: 4 },
    });
    expect(useDraftStore.getState().draft).toEqual({
      type: 'ellipse',
      box: { x: 1, y: 2, width: 3, height: 4 },
    });

    useDraftStore.getState().clearDraft();
    expect(useDraftStore.getState().draft).toBeNull();
  });
});
