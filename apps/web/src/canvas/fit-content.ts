import { type BoardDoc, getElements, unionBounds } from '@mozaik/model';
import type { CanvasSize } from '@/state/canvas-size-store';
import { useViewportStore } from '@/state/viewport-store';

/**
 * Fits the viewport on the whole content of the board (F02-S4): the bounding box
 * of every element is centered and fully visible, with a `FIT_PADDING` margin and
 * a zoom out when the content is larger than the viewport. An empty board returns
 * to the default viewport. Shared by the `Shift+1` shortcut and the zoom controls
 * button (F02-S4-AC5), so both trigger exactly the same computation.
 */
export function fitViewportToContent(doc: BoardDoc, canvas: CanvasSize): void {
  const bounds = unionBounds(
    getElements(doc).map((element) => ({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    })),
  );
  useViewportStore.getState().fitToContent(bounds, canvas);
}
