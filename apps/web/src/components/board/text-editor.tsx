import {
  type BoardDoc,
  STICKY_FONT_SIZE,
  type StickyElement,
  stickyTextColor,
  type TextElement,
  updateElement,
  worldToScreen,
} from '@mozaik/model';
import { useEffect, useRef, useState } from 'react';
import { useEditingStore } from '@/state/editing-store';
import { useViewportStore } from '@/state/viewport-store';

export type EditableElement = StickyElement | TextElement;

/**
 * Text input overlaid on the edited element, with the same position, size and
 * font size as its rendering (F03-S2, UI-BOARD-9). The text is committed on
 * Escape or when the field loses focus.
 */
export function TextEditor({ doc, element }: { doc: BoardDoc; element: EditableElement }) {
  const viewport = useViewportStore((state) => state.viewport);
  const stopEditing = useEditingStore((state) => state.stopEditing);
  const [value, setValue] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const commit = (): void => {
    updateElement(doc, element.id, { text: value });
    stopEditing();
  };

  const screen = worldToScreen(viewport, { x: element.x, y: element.y });

  return (
    <textarea
      ref={textareaRef}
      data-testid="text-editor"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          commit();
        }
      }}
      className="absolute resize-none overflow-hidden bg-transparent text-center outline-none"
      style={{
        left: screen.x,
        top: screen.y,
        width: element.width * viewport.zoom,
        height: element.height * viewport.zoom,
        padding: 8,
        fontSize: STICKY_FONT_SIZE * viewport.zoom,
        color: stickyTextColor(element.color),
        border: '1px solid var(--selection)',
      }}
    />
  );
}
