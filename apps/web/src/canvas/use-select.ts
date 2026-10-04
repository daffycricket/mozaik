import {
  type BoardDoc,
  type BoardHistory,
  type Box,
  boxFromPoints,
  elementAtPoint,
  elementsInBox,
  getElements,
  isResizable,
  moveElements,
  type Point,
  type ResizeHandle,
  resizeBox,
  resizeHandleAtPoint,
  resizeHandlePoint,
  screenToWorld,
  updateElement,
} from '@mozaik/model';
import { type RefObject, useEffect, useState } from 'react';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';
import { useSpacePan } from '@/tools/shortcuts';
import { HANDLE_SIZE } from './selection-handles';

const DRAG_THRESHOLD = 4;
const MOVE_SEND_INTERVAL_MS = 50;

type ResizeState = {
  id: string;
  handle: ResizeHandle;
  box: Box;
  startWorld: Point;
  startHandle: Point;
  pendingWorld: Point;
  shiftKey: boolean;
  lastSent: number;
  lastWritten: Box;
  timer: ReturnType<typeof setTimeout> | null;
};

function sameBox(a: Box, b: Box): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Selection, movement and resizing interactions of the canvas (F07-S1, F07-S2,
 * F07-S3). A click selects one element, Shift+click toggles it (AC2), a drag
 * from an empty area selects the elements it fully contains (AC3), `Ctrl+A`
 * selects everything and Escape or an empty click clears the selection (AC4). A
 * drag on a selected element moves the whole selection; intermediate positions
 * are written at most every 50 ms and the drag is a single undo entry (F07-S2).
 * A drag on a handle resizes a single resizable element, keeping the opposite
 * edge fixed, preserving the ratio with Shift and clamping to the minimum size
 * (F07-S3). Inactive while panning (hand tool or space). Returns the rectangle
 * being dragged, to render it.
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

    let resize: ResizeState | null = null;

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

    const flushResize = (): void => {
      if (resize === null) {
        return;
      }
      resize.timer = null;
      const pointer = {
        x: resize.startHandle.x + (resize.pendingWorld.x - resize.startWorld.x),
        y: resize.startHandle.y + (resize.pendingWorld.y - resize.startWorld.y),
      };
      const next = resizeBox(resize.box, resize.handle, pointer, {
        preserveAspectRatio: resize.shiftKey,
      });
      if (sameBox(next, resize.lastWritten)) {
        return;
      }
      resize.lastSent = performance.now();
      resize.lastWritten = next;
      updateElement(doc, resize.id, next);
    };

    const startResize = (event: PointerEvent, world: Point): boolean => {
      const selection = useSelectionStore.getState().selection;
      const selected = getElements(doc).filter((element) => selection.includes(element.id));
      const single = selected.length === 1 ? selected[0] : undefined;
      if (single === undefined || !isResizable(single)) {
        return false;
      }
      const box = { x: single.x, y: single.y, width: single.width, height: single.height };
      const tolerance = HANDLE_SIZE / useViewportStore.getState().viewport.zoom;
      const handle = resizeHandleAtPoint(box, world, tolerance);
      if (handle === undefined) {
        return false;
      }
      resize = {
        id: single.id,
        handle,
        box,
        startWorld: world,
        startHandle: resizeHandlePoint(box, handle),
        pendingWorld: world,
        shiftKey: event.shiftKey,
        lastSent: 0,
        lastWritten: box,
        timer: null,
      };
      history?.stopCapturing();
      container.setPointerCapture?.(event.pointerId);
      return true;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || !canSelect()) {
        return;
      }
      const world = worldAt(event);
      if (startResize(event, world)) {
        return;
      }
      const hit = elementAtPoint(getElements(doc), world);
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
        lastFlushedWorld = world;
        pendingWorld = lastFlushedWorld;
        lastSent = 0;
        history?.stopCapturing();
        container.setPointerCapture?.(event.pointerId);
        return;
      }
      startWorld = world;
      startLocal = localPoint(event);
      isDragging = false;
      container.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (resize !== null) {
        resize.pendingWorld = worldAt(event);
        resize.shiftKey = event.shiftKey;
        const elapsed = performance.now() - resize.lastSent;
        if (elapsed >= MOVE_SEND_INTERVAL_MS) {
          flushResize();
        } else if (resize.timer === null) {
          resize.timer = setTimeout(flushResize, MOVE_SEND_INTERVAL_MS - elapsed);
        }
        return;
      }
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

    const endResize = (event: PointerEvent): void => {
      if (resize === null) {
        return;
      }
      if (resize.timer !== null) {
        clearTimeout(resize.timer);
      }
      flushResize();
      resize = null;
      history?.stopCapturing();
      if (container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (resize !== null) {
        endResize(event);
        return;
      }
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
      if (resize !== null && resize.timer !== null) {
        clearTimeout(resize.timer);
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
