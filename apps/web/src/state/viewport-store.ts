import {
  DEFAULT_VIEWPORT,
  type Point,
  panViewport,
  type Viewport,
  zoomViewport,
} from '@mozaik/model';
import { create } from 'zustand';

type ViewportStore = {
  viewport: Viewport;
  panByScreen: (screenDelta: Point) => void;
  zoomTo: (zoom: number, screenPoint: Point) => void;
  zoomBy: (factor: number, screenPoint: Point) => void;
  resetViewport: () => void;
};

/**
 * Viewport of the board, local to the user (never shared nor persisted).
 */
export const useViewportStore = create<ViewportStore>((set) => ({
  viewport: { ...DEFAULT_VIEWPORT },
  panByScreen: (screenDelta) =>
    set((state) => ({ viewport: panViewport(state.viewport, screenDelta) })),
  zoomTo: (zoom, screenPoint) =>
    set((state) => ({ viewport: zoomViewport(state.viewport, zoom, screenPoint) })),
  zoomBy: (factor, screenPoint) =>
    set((state) => ({
      viewport: zoomViewport(state.viewport, state.viewport.zoom * factor, screenPoint),
    })),
  resetViewport: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),
}));
