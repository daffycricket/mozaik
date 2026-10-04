import {
  arrowFromDrag,
  type BoardDoc,
  createArrow,
  type Point,
  screenToWorld,
} from '@mozaik/model';
import { type RefObject, useEffect } from 'react';
import { loadStoredIdentity } from '@/identity/identity';
import { useDraftStore } from '@/state/draft-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

const DRAG_THRESHOLD = 4;

/**
 * Arrow drawing on the canvas with the Arrow tool (`A`) (F06-S1). A drag creates
 * a free arrow from the start point to the end point; a drag shorter than
 * `ARROW_MIN_LENGTH` creates nothing. The in-progress arrow is a local preview
 * that follows the pointer (F06-S1-AC4) and is written to the document in one
 * local transaction on release; the new arrow is selected and the tool returns
 * to Selection.
 */
export function useDrawArrow(
  containerRef: RefObject<HTMLElement | null>,
  doc: BoardDoc | null,
): void {
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

    let startWorld: Point | null = null;
    let startLocal: Point | null = null;
    let isDragging = false;

    const reset = (): void => {
      startWorld = null;
      startLocal = null;
      isDragging = false;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || useToolStore.getState().tool !== 'arrow') {
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
      const end = worldAt(event);
      useDraftStore.getState().setDraft({
        type: 'arrow',
        x1: startWorld.x,
        y1: startWorld.y,
        x2: end.x,
        y2: end.y,
      });
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (startWorld === null) {
        return;
      }
      const origin = startWorld;
      const end = worldAt(event);
      const wasDragging = isDragging;
      reset();
      useDraftStore.getState().clearDraft();
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      if (!wasDragging) {
        return;
      }
      const arrow = arrowFromDrag(origin, end);
      if (arrow === null) {
        return;
      }
      const identity = loadStoredIdentity();
      if (identity === null) {
        return;
      }
      const element = createArrow(
        doc,
        { x: arrow.x1, y: arrow.y1 },
        { x: arrow.x2, y: arrow.y2 },
        { id: crypto.randomUUID(), createdBy: identity.id },
      );
      useSelectionStore.getState().setSelection([element.id]);
      useToolStore.getState().setTool('select');
    };

    const onPointerCancel = (event: PointerEvent): void => {
      reset();
      useDraftStore.getState().clearDraft();
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);
    return () => {
      useDraftStore.getState().clearDraft();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [containerRef, doc]);
}
