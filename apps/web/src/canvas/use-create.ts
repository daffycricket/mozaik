import { type BoardDoc, createSticky, screenToWorld } from '@mozaik/model';
import { type RefObject, useEffect } from 'react';
import { loadStoredIdentity } from '@/identity/identity';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

/**
 * Sticky note creation on the canvas: a click with the sticky tool creates and
 * selects a note then returns to the selection tool (F03-S1-AC1); a double-click
 * with the selection tool creates a note and enters text editing (F03-S1-AC2).
 */
export function useCreateSticky(
  containerRef: RefObject<HTMLElement | null>,
  doc: BoardDoc | null,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const createAt = (event: MouseEvent, isEditing: boolean): void => {
      const identity = loadStoredIdentity();
      if (doc === null || identity === null) {
        return;
      }
      const bounds = container.getBoundingClientRect();
      const world = screenToWorld(useViewportStore.getState().viewport, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const sticky = createSticky(doc, world, {
        id: crypto.randomUUID(),
        createdBy: identity.id,
      });
      useSelectionStore.getState().setSelection([sticky.id]);
      useToolStore.getState().setTool('select');
      if (isEditing) {
        useEditingStore.getState().startEditing(sticky.id);
      }
    };
    const onClick = (event: MouseEvent): void => {
      if (useToolStore.getState().tool === 'sticky') {
        createAt(event, false);
      }
    };
    const onDoubleClick = (event: MouseEvent): void => {
      if (useToolStore.getState().tool === 'select') {
        createAt(event, true);
      }
    };
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);
    return () => {
      container.removeEventListener('click', onClick);
      container.removeEventListener('dblclick', onDoubleClick);
    };
  }, [containerRef, doc]);
}
