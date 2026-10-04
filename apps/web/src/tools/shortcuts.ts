import {
  type BoardDoc,
  type BoardHistory,
  bringForward,
  deleteElements,
  getElement,
  moveElements,
  type Point,
  sendBackward,
  ZOOM_STEP,
} from '@mozaik/model';
import { useEffect, useState } from 'react';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { type Tool, useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  h: 'hand',
  n: 'sticky',
  r: 'rect',
  o: 'ellipse',
};

const MOVE_STEP = 1;
const MOVE_STEP_LARGE = 10;

const ARROW_DELTAS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Switches the active tool with the shortcuts of `features/README.md` (`V`
 * selection, `H` hand, `N` sticky, `R` rectangle, `O` ellipse). Inactive while a
 * text field or an editable area has focus.
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
 * Moves the selection with the arrow keys: 1 world unit, or 10 with Shift
 * (F07-S2-AC2). Inactive while a text field has focus or no element is selected.
 */
export function useMoveShortcuts(doc: BoardDoc | null): void {
  useEffect(() => {
    if (doc === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTextEditingTarget(event.target)) {
        return;
      }
      const direction = ARROW_DELTAS[event.key];
      if (direction === undefined) {
        return;
      }
      const selection = useSelectionStore.getState().selection;
      if (selection.length === 0) {
        return;
      }
      event.preventDefault();
      const step = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;
      moveElements(doc, selection, { x: direction.x * step, y: direction.y * step });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc]);
}

/**
 * Moves the selection one step forward (`]`) or backward (`[`) in the stacking
 * order (F07-S4-AC1, AC2). Inactive while a text field has focus or no element
 * is selected.
 */
export function useOrderShortcuts(doc: BoardDoc | null): void {
  useEffect(() => {
    if (doc === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTextEditingTarget(event.target)) {
        return;
      }
      if (event.key !== ']' && event.key !== '[') {
        return;
      }
      const selection = useSelectionStore.getState().selection;
      if (selection.length === 0) {
        return;
      }
      event.preventDefault();
      if (event.key === ']') {
        bringForward(doc, selection);
      } else {
        sendBackward(doc, selection);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc]);
}

/**
 * Deletes the selection with `Delete` or `Backspace` in a single local
 * transaction (F08-S1-AC1), then clears the local selection. Inactive while a
 * text field has focus or an element is being edited, so `Backspace` keeps
 * erasing characters (F08-S1-AC2), and without a selection.
 */
export function useDeleteShortcut(doc: BoardDoc | null): void {
  useEffect(() => {
    if (doc === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      if (isTextEditingTarget(event.target) || useEditingStore.getState().editingId !== null) {
        return;
      }
      const selection = useSelectionStore.getState().selection;
      if (selection.length === 0) {
        return;
      }
      event.preventDefault();
      deleteElements(doc, selection);
      useSelectionStore.getState().clearSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doc]);
}

/**
 * Undoes the last local modification with `Ctrl+Z` and redoes it with
 * `Ctrl+Shift+Z` (F08-S2-AC1). The history only tracks local transactions, so
 * undoing never reverts another user's work (F08-S2-AC2). Inactive while a text
 * field has focus, so it does not steal the native undo.
 */
export function useHistoryShortcuts(history: BoardHistory | null): void {
  useEffect(() => {
    if (history === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      if (event.key.toLowerCase() !== 'z' || isTextEditingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        history.redo();
      } else {
        history.undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);
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
