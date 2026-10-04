import { create } from 'zustand';

export type CanvasSize = { width: number; height: number };

type CanvasSizeStore = {
  size: CanvasSize;
  setSize: (size: CanvasSize) => void;
};

/**
 * Size of the canvas area in CSS pixels, local interface state. It lets the
 * zoom buttons and shortcuts anchor on the center of the visible canvas.
 */
export const useCanvasSizeStore = create<CanvasSizeStore>((set) => ({
  size: { width: 0, height: 0 },
  setSize: (size) =>
    set((state) =>
      state.size.width === size.width && state.size.height === size.height ? state : { size },
    ),
}));
