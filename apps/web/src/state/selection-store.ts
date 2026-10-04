import { create } from 'zustand';

type SelectionStore = {
  selection: string[];
  setSelection: (ids: string[]) => void;
  toggle: (id: string) => void;
  clearSelection: () => void;
};

/**
 * Selected element ids of the board, local interface state, never shared.
 * `toggle` adds or removes an element, for the Shift-click of F07-S1-AC2.
 */
export const useSelectionStore = create<SelectionStore>((set) => ({
  selection: [],
  setSelection: (selection) => set({ selection }),
  toggle: (id) =>
    set((state) => ({
      selection: state.selection.includes(id)
        ? state.selection.filter((selected) => selected !== id)
        : [...state.selection, id],
    })),
  clearSelection: () => set({ selection: [] }),
}));
