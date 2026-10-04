import { DEFAULT_VIEWPORT, type Point, panViewport, type Viewport } from '@mozaik/model';
import { create } from 'zustand';

type ViewportStore = {
  viewport: Viewport;
  panByScreen: (screenDelta: Point) => void;
  resetViewport: () => void;
};

/**
 * Viewport of the board, local to the user (never shared nor persisted).
 */
export const useViewportStore = create<ViewportStore>((set) => ({
  viewport: { ...DEFAULT_VIEWPORT },
  panByScreen: (screenDelta) =>
    set((state) => ({ viewport: panViewport(state.viewport, screenDelta) })),
  resetViewport: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),
}));
