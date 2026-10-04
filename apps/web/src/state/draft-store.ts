import type { Box, ShapeType } from '@mozaik/model';
import { create } from 'zustand';

export type ShapeDraft = { type: ShapeType; box: Box };

type DraftStore = {
  draft: ShapeDraft | null;
  setDraft: (draft: ShapeDraft) => void;
  clearDraft: () => void;
};

/**
 * Preview of the shape being dragged, local interface state: it is rendered on
 * the canvas and written to the document only on release (F04-S1-AC5).
 */
export const useDraftStore = create<DraftStore>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
