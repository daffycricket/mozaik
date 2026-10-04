import {
  bringForward,
  canBringForward,
  canSendBackward,
  PALETTE,
  PALETTE_COLORS,
  type PaletteColor,
  sendBackward,
  setElementsColor,
  unionBounds,
  worldToScreen,
} from '@mozaik/model';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useElements } from '@/canvas/use-elements';
import { useBoardDoc } from '@/collab/board-doc-context';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSelectionStore } from '@/state/selection-store';
import { useViewportStore } from '@/state/viewport-store';

const BAR_GAP = 8;

/**
 * Floating context bar of the board. It appears for any non-empty selection,
 * centered above the selection frame, eight pixels away, and drops below it when
 * there is no room above (UI-BOARD-7). It shows the ten palette colours only
 * when the selection contains a sticky note or a free text (F03-S3), then the
 * "Avancer" and "Reculer" buttons, disabled at the limits of the stacking order
 * (F07-S4, UI-BOARD-8).
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
  const selectedIds = selected.map((element) => element.id);
  const recolorable = selected.filter(
    (element) => element.type === 'sticky' || element.type === 'text',
  );
  const box = unionBounds(
    selected.map((element) => ({
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
  const canForward = canBringForward(doc, selectedIds);
  const canBackward = canSendBackward(doc, selectedIds);

  const topLeft = worldToScreen(viewport, { x: box.x, y: box.y });
  const width = box.width * viewport.zoom;
  const height = box.height * viewport.zoom;
  const placeBelow = topLeft.y - BAR_GAP - barHeight < 0;
  const top = placeBelow ? topLeft.y + height + BAR_GAP : topLeft.y - BAR_GAP;

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label="Actions"
      data-testid="context-bar"
      className="absolute z-10 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-md"
      style={{
        left: topLeft.x + width / 2,
        top,
        transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      {recolorable.length > 0 && (
        <>
          <ToggleGroup
            value={currentColor === null ? [] : [currentColor]}
            onValueChange={(value) => {
              const next = value[0];
              if (next !== undefined) {
                setElementsColor(doc, selectedIds, next as PaletteColor);
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
          <div aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Avancer"
        title="Avancer"
        data-testid="order-forward"
        disabled={!canForward}
        onClick={() => bringForward(doc, selectedIds)}
      >
        <ChevronsUp aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Reculer"
        title="Reculer"
        data-testid="order-backward"
        disabled={!canBackward}
        onClick={() => sendBackward(doc, selectedIds)}
      >
        <ChevronsDown aria-hidden="true" />
      </Button>
    </div>
  );
}
