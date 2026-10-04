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

describe('[F06-S1-AC4] arrow draft preview', () => {
  test('[F06-S1-AC4] stores and clears the previewed arrow', () => {
    useDraftStore.getState().setDraft({ type: 'arrow', x1: 1, y1: 2, x2: 30, y2: 40 });
    expect(useDraftStore.getState().draft).toEqual({
      type: 'arrow',
      x1: 1,
      y1: 2,
      x2: 30,
      y2: 40,
    });

    useDraftStore.getState().clearDraft();
    expect(useDraftStore.getState().draft).toBeNull();
  });
});
