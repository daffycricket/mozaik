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

describe('[F07-S1-AC2] selection store toggle', () => {
  test('[F07-S1-AC2] adds an element then removes it', () => {
    useSelectionStore.getState().setSelection(['s1']);

    useSelectionStore.getState().toggle('s2');
    expect(useSelectionStore.getState().selection).toEqual(['s1', 's2']);

    useSelectionStore.getState().toggle('s1');
    expect(useSelectionStore.getState().selection).toEqual(['s2']);
  });
});

describe('[F07-S1-AC4] selection store select-all', () => {
  test('[F07-S1-AC4] replaces the selection with every element then clears it', () => {
    useSelectionStore.getState().setSelection(['s1']);

    useSelectionStore.getState().setSelection(['s1', 's2', 's3']);
    expect(useSelectionStore.getState().selection).toEqual(['s1', 's2', 's3']);

    useSelectionStore.getState().clearSelection();
    expect(useSelectionStore.getState().selection).toEqual([]);
  });
});
