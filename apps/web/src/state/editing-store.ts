import { create } from 'zustand';

type EditingStore = {
  editingId: string | null;
  startEditing: (id: string) => void;
  stopEditing: () => void;
};

/**
 * Element currently edited in the overlaid text editor, local interface state.
 */
export const useEditingStore = create<EditingStore>((set) => ({
  editingId: null,
  startEditing: (editingId) => set({ editingId }),
  stopEditing: () => set({ editingId: null }),
}));
