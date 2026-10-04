import { type Point, screenToWorld, userColor } from '@mozaik/model';
import { type RefObject, useEffect } from 'react';
import { useViewportStore } from '@/state/viewport-store';
import { usePresenceSession } from './presence-context';

export const CURSOR_SEND_INTERVAL_MS = 50;

/**
 * Publishes the local user and cursor in the Yjs Awareness state. The cursor is
 * converted to world coordinates and sent at most every 50 ms (F10-S2, FL-4).
 */
export function useLocalCursor(containerRef: RefObject<HTMLElement | null>): void {
  const session = usePresenceSession();
  useEffect(() => {
    if (session === null) {
      return;
    }
    const { provider, identity } = session;
    provider.setAwarenessField('user', {
      id: identity.id,
      name: identity.name,
      color: userColor(identity.id),
    });
    provider.setAwarenessField('cursor', null);

    const container = containerRef.current;
    if (container === null) {
      return;
    }
    let lastSent = 0;
    let pending: Point | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = (): void => {
      timer = null;
      if (pending === null) {
        return;
      }
      lastSent = performance.now();
      provider.setAwarenessField('cursor', pending);
    };
    const onPointerMove = (event: PointerEvent): void => {
      const bounds = container.getBoundingClientRect();
      pending = screenToWorld(useViewportStore.getState().viewport, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const elapsed = performance.now() - lastSent;
      if (elapsed >= CURSOR_SEND_INTERVAL_MS) {
        flush();
      } else if (timer === null) {
        timer = setTimeout(flush, CURSOR_SEND_INTERVAL_MS - elapsed);
      }
    };
    container.addEventListener('pointermove', onPointerMove);
    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      if (timer !== null) {
        clearTimeout(timer);
      }
      provider.setAwarenessField('cursor', null);
    };
  }, [session, containerRef]);
}
