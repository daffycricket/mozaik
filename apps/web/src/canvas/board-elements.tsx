import {
  type Element,
  fitStickyFontSize,
  PALETTE,
  type StickyElement,
  sortByZIndex,
  stickyTextColor,
} from '@mozaik/model';
import { Group, Rect, Text } from 'react-konva';

function StickyNote({ element, isEditing }: { element: StickyElement; isEditing: boolean }) {
  const fontSize = fitStickyFontSize(element.text, {
    width: element.width,
    height: element.height,
  });
  return (
    <Group x={element.x} y={element.y}>
      <Rect
        width={element.width}
        height={element.height}
        fill={PALETTE[element.color].background}
      />
      {!isEditing && (
        <Text
          text={element.text}
          width={element.width}
          height={element.height}
          align="center"
          verticalAlign="middle"
          wrap="word"
          padding={8}
          fontSize={fontSize}
          fill={stickyTextColor(element.color)}
        />
      )}
    </Group>
  );
}

/**
 * Konva rendering of the board elements, in world coordinates, from the bottom
 * to the top of the stacking order (`zIndex`, F07-S4). Only the sticky notes
 * exist at this stage; the other element types land with their stories. The
 * text of the element being edited is hidden behind its HTML input.
 */
export function BoardElements({
  elements,
  editingId,
}: {
  elements: Element[];
  editingId: string | null;
}) {
  return (
    <>
      {sortByZIndex(elements).map((element) =>
        element.type === 'sticky' ? (
          <StickyNote key={element.id} element={element} isEditing={element.id === editingId} />
        ) : null,
      )}
    </>
  );
}
