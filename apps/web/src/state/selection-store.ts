import { create } from 'zustand';

type SelectionStore = {
  selection: string[];
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
};

/**
 * Selected element ids of the board, local interface state, never shared.
 */
export const useSelectionStore = create<SelectionStore>((set) => ({
  selection: [],
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: [] }),
}));
