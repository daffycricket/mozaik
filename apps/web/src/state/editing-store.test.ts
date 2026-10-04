import { afterEach, describe, expect, test } from 'vitest';
import { useEditingStore } from './editing-store';

afterEach(() => {
  useEditingStore.setState({ editingId: null });
});

describe('[F03-S1-AC2] editing store', () => {
  test('[F03-S1-AC2] starts and stops the text editing of an element', () => {
    expect(useEditingStore.getState().editingId).toBeNull();

    useEditingStore.getState().startEditing('s1');
    expect(useEditingStore.getState().editingId).toBe('s1');

    useEditingStore.getState().stopEditing();
    expect(useEditingStore.getState().editingId).toBeNull();
  });
});
