import {
  type BoardDoc,
  createShape,
  defaultShapeBox,
  type Point,
  type ShapeType,
  screenToWorld,
  shapeBoxFromDrag,
} from '@mozaik/model';
import { type RefObject, useEffect } from 'react';
import { loadStoredIdentity } from '@/identity/identity';
import { useDraftStore } from '@/state/draft-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

const DRAG_THRESHOLD = 4;

/**
 * Shape drawing on the canvas with the Rectangle (`R`) and Ellipse (`O`) tools
 * (F04-S1). A drag creates a rectangle or ellipse whose opposite corners are the
 * start and end points, in every direction; a simple click creates the default
 * size centered on the click; holding Shift while drawing an ellipse squares it
 * into a circle. The in-progress shape is a local preview that follows the
 * pointer (F04-S1-AC5) and is written to the document in one local transaction
 * on release; the new shape is selected and the tool returns to Selection.
 */
export function useDrawShape(
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
    let type: ShapeType | null = null;
    let isDragging = false;

    const reset = (): void => {
      startWorld = null;
      startLocal = null;
      type = null;
      isDragging = false;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) {
        return;
      }
      const tool = useToolStore.getState().tool;
      if (tool !== 'rect' && tool !== 'ellipse') {
        return;
      }
      type = tool;
      startWorld = worldAt(event);
      startLocal = localPoint(event);
      isDragging = false;
      container.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (startWorld === null || startLocal === null || type === null) {
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
      useDraftStore.getState().setDraft({
        type,
        box: shapeBoxFromDrag(startWorld, worldAt(event), {
          square: type === 'ellipse' && event.shiftKey,
        }),
      });
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (startWorld === null || type === null) {
        return;
      }
      const shapeType = type;
      const origin = startWorld;
      const clicked = !isDragging;
      const shiftKey = event.shiftKey;
      reset();
      useDraftStore.getState().clearDraft();
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      const identity = loadStoredIdentity();
      if (identity === null) {
        return;
      }
      const box = clicked
        ? defaultShapeBox(origin)
        : shapeBoxFromDrag(origin, worldAt(event), {
            square: shapeType === 'ellipse' && shiftKey,
          });
      const element = createShape(doc, shapeType, box, {
        id: crypto.randomUUID(),
        createdBy: identity.id,
      });
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
