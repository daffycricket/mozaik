import {
  type BoardDoc,
  deleteElements,
  fitStickyFontSize,
  measureTextBox,
  PALETTE,
  STICKY_TEXT_MAX_LENGTH,
  type StickyElement,
  stickyTextColor,
  TEXT_FONT_SIZE,
  type TextElement,
  updateElement,
  worldToScreen,
} from '@mozaik/model';
import { useEffect, useRef, useState } from 'react';
import { useEditingStore } from '@/state/editing-store';
import { useSelectionStore } from '@/state/selection-store';
import { useViewportStore } from '@/state/viewport-store';

export type EditableElement = StickyElement | TextElement;

/**
 * Text input overlaid on the edited element, with the same position, size and
 * font size as its rendering (F03-S2, UI-BOARD-9). Enter or Escape validates the
 * text, Shift+Enter inserts a line break, and losing focus validates it too. For
 * a free text the font size is fixed and the box follows the typed content
 * (F05-S1); an empty free text is removed on validation (F05-S1-AC2).
 */
export function TextEditor({ doc, element }: { doc: BoardDoc; element: EditableElement }) {
  const viewport = useViewportStore((state) => state.viewport);
  const stopEditing = useEditingStore((state) => state.stopEditing);
  const [value, setValue] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const committedRef = useRef(false);
  const isText = element.type === 'text';

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const commit = (): void => {
    if (committedRef.current) {
      return;
    }
    committedRef.current = true;
    if (isText) {
      if (value.length === 0) {
        deleteElements(doc, [element.id]);
        useSelectionStore.getState().clearSelection();
      } else {
        updateElement(doc, element.id, { text: value, ...measureTextBox(value) });
      }
    } else {
      updateElement(doc, element.id, { text: value });
    }
    stopEditing();
  };

  const screen = worldToScreen(viewport, { x: element.x, y: element.y });
  const box = isText ? measureTextBox(value) : { width: element.width, height: element.height };
  const fontSize = isText
    ? TEXT_FONT_SIZE
    : fitStickyFontSize(element.text, { width: element.width, height: element.height });
  const color = isText ? PALETTE[element.color].text : stickyTextColor(element.color);

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
      className="absolute resize-none overflow-hidden bg-transparent outline-none"
      style={{
        left: screen.x,
        top: screen.y,
        width: box.width * viewport.zoom,
        height: box.height * viewport.zoom,
        padding: isText ? 0 : 8,
        textAlign: isText ? 'left' : 'center',
        fontSize: fontSize * viewport.zoom,
        color,
        border: '1px solid var(--selection)',
      }}
    />
  );
}
