import { ZOOM_STEP } from '@mozaik/model';
import { Maximize, Minus, Plus } from 'lucide-react';
import { fitViewportToContent } from '@/canvas/fit-content';
import { useBoardDoc } from '@/collab/board-doc-context';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCanvasSizeStore } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';

const FIT_LABEL = 'Recadrer sur tout le contenu (Shift+1)';

/**
 * Floating zoom controls at the bottom right: zoom out, current percentage,
 * zoom in, then fit content (UI-BOARD-5). The step buttons zoom by steps,
 * anchored on the canvas center; the fit button triggers the same recadrage as
 * `Shift+1` (F02-S4-AC5) through the shared `fitViewportToContent`.
 */
export function ZoomControls() {
  const doc = useBoardDoc();
  const zoom = useViewportStore((state) => state.viewport.zoom);
  const zoomBy = useViewportStore((state) => state.zoomBy);
  const size = useCanvasSizeStore((state) => state.size);
  const center = { x: size.width / 2, y: size.height / 2 };

  return (
    <TooltipProvider delay={0}>
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="zoom-fit"
                aria-label={FIT_LABEL}
                onClick={() => {
                  if (doc !== null) {
                    fitViewportToContent(doc, size);
                  }
                }}
              />
            }
          >
            <Maximize aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>{FIT_LABEL}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
