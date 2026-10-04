import {
  type BoardDoc,
  type Box,
  boxFromPoints,
  elementAtPoint,
  elementsInBox,
  getElements,
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

/**
 * Selection interactions of the canvas (F07-S1): a click selects one element,
 * Shift+click toggles it (AC2), a drag from an empty area selects the elements
 * it fully contains (AC3), `Ctrl+A` selects everything and Escape or an empty
 * click clears the selection (AC4). Inactive while panning (hand tool or space).
 * Returns the rectangle being dragged, to render it.
 */
export function useSelect(
  containerRef: RefObject<HTMLElement | null>,
  doc: BoardDoc | null,
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

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || !canSelect()) {
        return;
      }
      const hit = elementAtPoint(getElements(doc), worldAt(event));
      const selection = useSelectionStore.getState();
      if (hit !== undefined) {
        if (event.shiftKey) {
          selection.toggle(hit.id);
        } else if (!selection.selection.includes(hit.id)) {
          selection.setSelection([hit.id]);
        }
        return;
      }
      startWorld = worldAt(event);
      startLocal = localPoint(event);
      isDragging = false;
      container.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
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

    const onPointerUp = (event: PointerEvent): void => {
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
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, doc, isSpaceHeld]);

  return marquee;
}
