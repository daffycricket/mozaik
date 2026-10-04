import type { ArrowPoints, Box, ShapeType } from '@mozaik/model';
import { create } from 'zustand';

export type ShapeDraft = { type: ShapeType; box: Box };
export type ArrowDraft = { type: 'arrow' } & ArrowPoints;
export type Draft = ShapeDraft | ArrowDraft;

type DraftStore = {
  draft: Draft | null;
  setDraft: (draft: Draft) => void;
  clearDraft: () => void;
};

/**
 * Preview of the shape or arrow being dragged, local interface state: it is
 * rendered on the canvas and written to the document only on release
 * (F04-S1-AC5, F06-S1-AC4).
 */
export const useDraftStore = create<DraftStore>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
