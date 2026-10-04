import { type BoardDoc, getElement, ZOOM_STEP } from '@mozaik/model';
import { useEffect, useState } from 'react';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { type Tool, useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

const TOOL_KEYS: Record<string, Tool> = { v: 'select', h: 'hand', n: 'sticky' };

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
 * Changes the zoom by steps with `Ctrl+=` / `Ctrl+-`, and resets it to 100 %
 * with `Ctrl+0` (F02-S2-AC3). The zoom is anchored on the center of the canvas.
 */
export function useZoomShortcuts(): void {
  const zoomBy = useViewportStore((state) => state.zoomBy);
  const zoomTo = useViewportStore((state) => state.zoomTo);
  const size = useCanvasSizeStore((state) => state.size);

  useEffect(() => {
    const center = { x: size.width / 2, y: size.height / 2 };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextEditingTarget(event.target)) {
        return;
      }
      if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        zoomBy(ZOOM_STEP, center);
      } else if (event.key === '-') {
        event.preventDefault();
        zoomBy(1 / ZOOM_STEP, center);
      } else if (event.key === '0') {
        event.preventDefault();
        zoomTo(1, center);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomBy, zoomTo, size]);
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

/**
 * Enters text editing on Enter when a single sticky note or text element is
 * selected (F03-S2-AC1). Inactive while a text field has focus.
 */
export function useStartEditingShortcut(doc: BoardDoc | null): void {
  const startEditing = useEditingStore((state) => state.startEditing);

  useEffect(() => {
    if (doc === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isTextEditingTarget(event.target)) {
        return;
      }
      const selection = useSelectionStore.getState().selection;
      const id = selection.length === 1 ? selection[0] : undefined;
      if (id === undefined) {
        return;
      }
      const element = getElement(doc, id);
      if (element === undefined || (element.type !== 'sticky' && element.type !== 'text')) {
        return;
      }
      event.preventDefault();
      startEditing(element.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc, startEditing]);
}
