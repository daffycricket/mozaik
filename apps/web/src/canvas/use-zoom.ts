import { type RefObject, useEffect } from 'react';
import { useViewportStore } from '@/state/viewport-store';

const WHEEL_SENSITIVITY = 0.002;

/**
 * Zooms the viewport on a `Ctrl`/`Cmd` wheel, centered on the pointer
 * (F02-S2-AC1). A plain wheel keeps panning (`usePan`).
 */
export function useWheelZoom(containerRef: RefObject<HTMLElement | null>): void {
  const zoomBy = useViewportStore((state) => state.zoomBy);

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * WHEEL_SENSITIVITY), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [containerRef, zoomBy]);
}
