import { useEffect, useState } from 'react';
import { type Tool, useToolStore } from '@/state/tool-store';

const TOOL_KEYS: Record<string, Tool> = { v: 'select', h: 'hand' };

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Switches the active tool with the `V` (selection) and `H` (hand) shortcuts.
 * Inactive while a text field or an editable area has focus.
 */
export function useToolShortcuts(): void {
  const setTool = useToolStore((state) => state.setTool);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTextEditingTarget(event.target)) {
        return;
      }
      const tool = TOOL_KEYS[event.key.toLowerCase()];
      if (tool !== undefined) {
        setTool(tool);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setTool]);
}

/**
 * Reports whether the space bar is held to pan regardless of the active tool
 * (F02-S1-AC3). The space key is ignored while a text field has focus.
 */
export function useSpacePan(): boolean {
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== 'Space' || isTextEditingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      setIsSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        setIsSpaceHeld(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return isSpaceHeld;
}
