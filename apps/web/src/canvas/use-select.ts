import {
  type BoardDoc,
  type BoardHistory,
  type Box,
  boxFromPoints,
  elementAtPoint,
  elementsInBox,
  getElements,
  moveElements,
  type Point,
  screenToWorld,
} from '@mozaik/model';
import { type RefObject, useEffect, useState } from 'react';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';
import { useSpacePan } from '@/tools/shortcuts';

const DRAG_THRESHOLD = 4;
const MOVE_SEND_INTERVAL_MS = 50;

/**
 * Selection and movement interactions of the canvas (F07-S1, F07-S2). A click
 * selects one element, Shift+click toggles it (AC2), a drag from an empty area
 * selects the elements it fully contains (AC3), `Ctrl+A` selects everything and
 * Escape or an empty click clears the selection (AC4). A drag on a selected
 * element moves the whole selection; intermediate positions are written at most
 * every 50 ms and the drag is a single undo entry (F07-S2). Inactive while
 * panning (hand tool or space). Returns the rectangle being dragged, to render
 * it.
 */
export function useSelect(
  containerRef: RefObject<HTMLElement | null>,
  doc: BoardDoc | null,
  history: BoardHistory | null,
): Box | null {
  const [marquee, setMarquee] = useState<Box | null>(null);
  const isSpaceHeld = useSpacePan();

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || doc === null) {
      return;
    }
    const localPoint = (event: PointerEvent): Point => {
      const bounds = container.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const worldAt = (event: PointerEvent): Point =>
      screenToWorld(useViewportStore.getState().viewport, localPoint(event));
    const canSelect = (): boolean => useToolStore.getState().tool === 'select' && !isSpaceHeld;

    let startWorld: Point | null = null;
    let startLocal: Point | null = null;
    let isDragging = false;

    let dragIds: string[] | null = null;
    let lastFlushedWorld: Point | null = null;
    let pendingWorld: Point | null = null;
    let lastSent = 0;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;

    const flushMove = (): void => {
      moveTimer = null;
      if (dragIds === null || lastFlushedWorld === null || pendingWorld === null) {
        return;
      }
      const delta = {
        x: pendingWorld.x - lastFlushedWorld.x,
        y: pendingWorld.y - lastFlushedWorld.y,
      };
      if (delta.x === 0 && delta.y === 0) {
        return;
      }
      lastSent = performance.now();
      moveElements(doc, dragIds, delta);
      lastFlushedWorld = pendingWorld;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || !canSelect()) {
        return;
      }
      const hit = elementAtPoint(getElements(doc), worldAt(event));
      const selection = useSelectionStore.getState();
      if (hit !== undefined) {
        if (event.shiftKey) {
          selection.toggle(hit.id);
          return;
        }
        if (!selection.selection.includes(hit.id)) {
          selection.setSelection([hit.id]);
        }
        dragIds = [...useSelectionStore.getState().selection];
        lastFlushedWorld = worldAt(event);
        pendingWorld = lastFlushedWorld;
        lastSent = 0;
        history?.stopCapturing();
        container.setPointerCapture?.(event.pointerId);
        return;
      }
      startWorld = worldAt(event);
      startLocal = localPoint(event);
      isDragging = false;
      container.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (dragIds !== null) {
        pendingWorld = worldAt(event);
        const elapsed = performance.now() - lastSent;
        if (elapsed >= MOVE_SEND_INTERVAL_MS) {
          flushMove();
        } else if (moveTimer === null) {
          moveTimer = setTimeout(flushMove, MOVE_SEND_INTERVAL_MS - elapsed);
        }
        return;
      }
      if (startWorld === null || startLocal === null) {
        return;
      }
      const current = localPoint(event);
      if (!isDragging) {
        const moved = Math.hypot(current.x - startLocal.x, current.y - startLocal.y);
        if (moved < DRAG_THRESHOLD) {
          return;
        }
        isDragging = true;
      }
      setMarquee(boxFromPoints(startWorld, worldAt(event)));
    };

    const endDrag = (event: PointerEvent): void => {
      if (moveTimer !== null) {
        clearTimeout(moveTimer);
        moveTimer = null;
      }
      flushMove();
      dragIds = null;
      lastFlushedWorld = null;
      pendingWorld = null;
      history?.stopCapturing();
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (dragIds !== null) {
        endDrag(event);
        return;
      }
      if (startWorld === null) {
        return;
      }
      const origin = startWorld;
      const wasDragging = isDragging;
      const endWorld = worldAt(event);
      startWorld = null;
      startLocal = null;
      isDragging = false;
      setMarquee(null);
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      if (wasDragging) {
        const ids = elementsInBox(getElements(doc), boxFromPoints(origin, endWorld)).map(
          (element) => element.id,
        );
        useSelectionStore.getState().setSelection(ids);
      } else {
        useSelectionStore.getState().clearSelection();
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (useEditingStore.getState().editingId !== null) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        useSelectionStore.getState().setSelection(getElements(doc).map((element) => element.id));
        return;
      }
      if (event.key === 'Escape') {
        useSelectionStore.getState().clearSelection();
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      if (moveTimer !== null) {
        clearTimeout(moveTimer);
      }
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, doc, history, isSpaceHeld]);

  return marquee;
}
