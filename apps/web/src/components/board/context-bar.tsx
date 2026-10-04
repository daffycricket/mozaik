import {
  PALETTE,
  PALETTE_COLORS,
  type PaletteColor,
  setElementsColor,
  unionBounds,
  worldToScreen,
} from '@mozaik/model';
import { useEffect, useRef, useState } from 'react';
import { useElements } from '@/canvas/use-elements';
import { useBoardDoc } from '@/collab/board-doc-context';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSelectionStore } from '@/state/selection-store';
import { useViewportStore } from '@/state/viewport-store';

const BAR_GAP = 8;

/**
 * Floating colour bar of the board (F03-S3). It appears only when the selection
 * contains a sticky note or a free text, offers the ten palette colours with the
 * current one pressed, and recolours every selected element in one transaction.
 * It sits centered above the selection frame, eight pixels away, and drops below
 * it when there is no room above (UI-BOARD-7).
 */
export function ContextBar() {
  const doc = useBoardDoc();
  const elements = useElements(doc);
  const selection = useSelectionStore((state) => state.selection);
  const viewport = useViewportStore((state) => state.viewport);
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const element = barRef.current;
    if (element === null) {
      return;
    }
    const height = element.offsetHeight;
    setBarHeight((current) => (current === height ? current : height));
  });

  const selected = elements.filter((element) => selection.includes(element.id));
  const recolorable = selected.filter(
    (element) => element.type === 'sticky' || element.type === 'text',
  );
  const box = unionBounds(
    recolorable.map((element) => ({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    })),
  );

  if (doc === null || box === null) {
    return null;
  }

  const colors = new Set(recolorable.map((element) => element.color));
  const currentColor: PaletteColor | null =
    colors.size === 1 ? (colors.values().next().value ?? null) : null;

  const topLeft = worldToScreen(viewport, { x: box.x, y: box.y });
  const width = box.width * viewport.zoom;
  const height = box.height * viewport.zoom;
  const placeBelow = topLeft.y - BAR_GAP - barHeight < 0;
  const top = placeBelow ? topLeft.y + height + BAR_GAP : topLeft.y - BAR_GAP;

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label="Couleur"
      data-testid="context-bar"
      className="absolute z-10 rounded-lg border bg-background p-1 shadow-md"
      style={{
        left: topLeft.x + width / 2,
        top,
        transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <ToggleGroup
        value={currentColor === null ? [] : [currentColor]}
        onValueChange={(value) => {
          const next = value[0];
          if (next !== undefined) {
            setElementsColor(
              doc,
              recolorable.map((element) => element.id),
              next as PaletteColor,
            );
          }
        }}
      >
        {PALETTE_COLORS.map((color) => (
          <ToggleGroupItem
            key={color}
            value={color}
            aria-label={color}
            data-testid={`color-${color}`}
            className="size-6 rounded-full border aria-pressed:ring-2 aria-pressed:ring-ring"
            style={{ backgroundColor: PALETTE[color].background }}
          />
        ))}
      </ToggleGroup>
    </div>
  );
}
