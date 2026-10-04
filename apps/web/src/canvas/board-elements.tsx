import {
  type Box,
  type Element,
  fitStickyFontSize,
  PALETTE,
  SHAPE_STROKE,
  SHAPE_STROKE_WIDTH,
  type ShapeType,
  type StickyElement,
  sortByZIndex,
  stickyTextColor,
  TEXT_FONT_SIZE,
  TEXT_LINE_HEIGHT_RATIO,
  type TextElement,
} from '@mozaik/model';
import { memo } from 'react';
import { Ellipse, Group, Rect, Text } from 'react-konva';

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

function TextNode({ element, isEditing }: { element: TextElement; isEditing: boolean }) {
  if (isEditing) {
    return null;
  }
  return (
    <Text
      x={element.x}
      y={element.y}
      width={element.width}
      text={element.text}
      wrap="word"
      lineHeight={TEXT_LINE_HEIGHT_RATIO}
      fontSize={TEXT_FONT_SIZE}
      fill={PALETTE[element.color].text}
    />
  );
}

/**
 * Konva rendering of a rectangle or an ellipse covering `box`, with the fixed
 * outline style of F04 (transparent fill, `SHAPE_STROKE`, 2 px). Shared by the
 * persisted elements and the drag preview.
 */
export function ShapeNode({ type, box }: { type: ShapeType; box: Box }) {
  if (type === 'rect') {
    return (
      <Rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        stroke={SHAPE_STROKE}
        strokeWidth={SHAPE_STROKE_WIDTH}
      />
    );
  }
  return (
    <Ellipse
      x={box.x + box.width / 2}
      y={box.y + box.height / 2}
      radiusX={box.width / 2}
      radiusY={box.height / 2}
      stroke={SHAPE_STROKE}
      strokeWidth={SHAPE_STROKE_WIDTH}
    />
  );
}

function BoardElementsView({
  elements,
  editingId,
}: {
  elements: Element[];
  editingId: string | null;
}) {
  return (
    <>
      {sortByZIndex(elements).map((element) => {
        switch (element.type) {
          case 'sticky':
            return (
              <StickyNote key={element.id} element={element} isEditing={element.id === editingId} />
            );
          case 'rect':
          case 'ellipse':
            return <ShapeNode key={element.id} type={element.type} box={element} />;
          case 'text':
            return (
              <TextNode key={element.id} element={element} isEditing={element.id === editingId} />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/**
 * Konva rendering of the board elements, in world coordinates, from the bottom
 * to the top of the stacking order (`zIndex`, F07-S4). Only the sticky notes,
 * the shapes and the free texts exist at this stage; the other element types
 * land with their stories. The text of the element being edited is hidden behind
 * its HTML input.
 * Memoized so a draft preview or a selection change does not re-render every
 * element (FL-2).
 */
export const BoardElements = memo(BoardElementsView);
