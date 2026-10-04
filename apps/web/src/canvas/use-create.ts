import {
  type BoardDoc,
  createSticky,
  elementAtPoint,
  getElements,
  screenToWorld,
} from '@mozaik/model';
import { type RefObject, useEffect } from 'react';
import { loadStoredIdentity } from '@/identity/identity';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';

/**
 * Sticky note creation and text editing on the canvas: a click with the sticky
 * tool creates and selects a note then returns to the selection tool
 * (F03-S1-AC1); a double-click with the selection tool edits the element under
 * the pointer when there is one, otherwise creates a note and enters editing
 * (F03-S1-AC2, F03-S2-AC1).
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
    const worldAt = (event: MouseEvent): ReturnType<typeof screenToWorld> => {
      const bounds = container.getBoundingClientRect();
      return screenToWorld(useViewportStore.getState().viewport, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    const createAt = (event: MouseEvent, isEditing: boolean): void => {
      const identity = loadStoredIdentity();
      if (doc === null || identity === null) {
        return;
      }
      const sticky = createSticky(doc, worldAt(event), {
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
      if (useToolStore.getState().tool !== 'select' || doc === null) {
        return;
      }
      const hit = elementAtPoint(getElements(doc), worldAt(event));
      if (hit !== undefined && (hit.type === 'sticky' || hit.type === 'text')) {
        useSelectionStore.getState().setSelection([hit.id]);
        useEditingStore.getState().startEditing(hit.id);
        return;
      }
      createAt(event, true);
    };
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);
    return () => {
      container.removeEventListener('click', onClick);
      container.removeEventListener('dblclick', onDoubleClick);
    };
  }, [containerRef, doc]);
}
