import { create } from 'zustand';

export type Tool = 'select' | 'hand' | 'sticky' | 'rect' | 'ellipse' | 'text';

type ToolStore = {
  tool: Tool;
  setTool: (tool: Tool) => void;
};

/**
 * Active tool of the board. Local interface state, never shared nor persisted.
 */
export const useToolStore = create<ToolStore>((set) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
}));
