import { ZOOM_STEP } from '@mozaik/model';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';

/**
 * Floating zoom controls at the bottom right: zoom out, current percentage,
 * zoom in (UI-BOARD-5). Buttons zoom by steps, anchored on the canvas center.
 */
export function ZoomControls() {
  const zoom = useViewportStore((state) => state.viewport.zoom);
  const zoomBy = useViewportStore((state) => state.zoomBy);
  const size = useCanvasSizeStore((state) => state.size);
  const center = { x: size.width / 2, y: size.height / 2 };

  return (
    <div
      data-testid="zoom-controls"
      className="absolute right-[var(--float-gap)] bottom-[var(--float-gap)] z-10 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-md"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-testid="zoom-out"
        aria-label="Zoom arrière (Ctrl+-)"
        onClick={() => zoomBy(1 / ZOOM_STEP, center)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span data-testid="zoom-level" aria-live="polite" className="w-12 text-center text-sm">
        {Math.round(zoom * 100)} %
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-testid="zoom-in"
        aria-label="Zoom avant (Ctrl+=)"
        onClick={() => zoomBy(ZOOM_STEP, center)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
