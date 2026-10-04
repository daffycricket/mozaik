import { afterEach, describe, expect, test } from 'vitest';
import { useSelectionStore } from './selection-store';

afterEach(() => {
  useSelectionStore.setState({ selection: [] });
});

describe('[F03-S1-AC1] selection store', () => {
  test('[F03-S1-AC1] selects the newly created element and clears the selection', () => {
    expect(useSelectionStore.getState().selection).toEqual([]);

    useSelectionStore.getState().setSelection(['s1']);
    expect(useSelectionStore.getState().selection).toEqual(['s1']);

    useSelectionStore.getState().clearSelection();
    expect(useSelectionStore.getState().selection).toEqual([]);
  });
});
