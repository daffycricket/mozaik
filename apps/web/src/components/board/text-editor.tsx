import {
  type BoardDoc,
  fitStickyFontSize,
  STICKY_TEXT_MAX_LENGTH,
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
 * font size as its rendering (F03-S2, UI-BOARD-9). Enter or Escape validates the
 * text, Shift+Enter inserts a line break, and losing focus validates it too.
 */
export function TextEditor({ doc, element }: { doc: BoardDoc; element: EditableElement }) {
  const viewport = useViewportStore((state) => state.viewport);
  const stopEditing = useEditingStore((state) => state.stopEditing);
  const [value, setValue] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const commit = (): void => {
    if (committedRef.current) {
      return;
    }
    committedRef.current = true;
    updateElement(doc, element.id, { text: value });
    stopEditing();
  };

  const screen = worldToScreen(viewport, { x: element.x, y: element.y });
  const fontSize = fitStickyFontSize(element.text, {
    width: element.width,
    height: element.height,
  });

  return (
    <textarea
      ref={textareaRef}
      data-testid="text-editor"
      value={value}
      maxLength={STICKY_TEXT_MAX_LENGTH}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
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
        fontSize: fontSize * viewport.zoom,
        color: stickyTextColor(element.color),
        border: '1px solid var(--selection)',
      }}
    />
  );
}
