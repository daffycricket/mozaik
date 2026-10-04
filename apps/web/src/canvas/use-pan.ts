import type { Point } from '@mozaik/model';
import { type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useRef } from 'react';
import { useToolStore } from '@/state/tool-store';
import { useViewportStore } from '@/state/viewport-store';
import { useSpacePan } from '@/tools/shortcuts';

export type PanHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
};

/**
 * Pan interactions of the canvas: a plain wheel scroll (F02-S1-AC1), a drag with
 * the hand tool (F02-S1-AC2) or with the space bar held (F02-S1-AC3).
 */
export function usePan(containerRef: RefObject<HTMLElement | null>): PanHandlers {
  const tool = useToolStore((state) => state.tool);
  const panByScreen = useViewportStore((state) => state.panByScreen);
  const isSpaceHeld = useSpacePan();
  const lastPoint = useRef<Point | null>(null);
  const canPan = tool === 'hand' || isSpaceHeld;

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      panByScreen({ x: -event.deltaX, y: -event.deltaY });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [containerRef, panByScreen]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!canPan) {
      return;
    }
    lastPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const previous = lastPoint.current;
    if (!canPan || previous === null) {
      return;
    }
    lastPoint.current = { x: event.clientX, y: event.clientY };
    panByScreen({ x: event.clientX - previous.x, y: event.clientY - previous.y });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>): void => {
    lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
