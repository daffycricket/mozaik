import {
  type Element,
  PALETTE,
  STICKY_FONT_SIZE,
  type StickyElement,
  stickyTextColor,
} from '@mozaik/model';
import { Group, Rect, Text } from 'react-konva';

function StickyNote({ element }: { element: StickyElement }) {
  return (
    <Group x={element.x} y={element.y}>
      <Rect
        width={element.width}
        height={element.height}
        fill={PALETTE[element.color].background}
      />
      <Text
        text={element.text}
        width={element.width}
        height={element.height}
        align="center"
        verticalAlign="middle"
        wrap="word"
        padding={8}
        fontSize={STICKY_FONT_SIZE}
        fill={stickyTextColor(element.color)}
      />
    </Group>
  );
}

/**
 * Konva rendering of the board elements, in world coordinates. Only the sticky
 * notes exist at this stage; the other element types land with their stories.
 */
export function BoardElements({ elements }: { elements: Element[] }) {
  return (
    <>
      {elements.map((element) =>
        element.type === 'sticky' ? <StickyNote key={element.id} element={element} /> : null,
      )}
    </>
  );
}
