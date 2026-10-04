import type { HocuspocusProvider } from '@hocuspocus/provider';
import {
  interpolatePoint,
  isPointVisible,
  type Point,
  type PresenceUser,
  parsePresenceState,
  type Viewport,
  worldToScreen,
} from '@mozaik/model';
import { useEffect, useState } from 'react';
import { Group, Label, Line, Tag, Text } from 'react-konva';
import { readProjectToken } from '@/lib/theme-tokens';
import type { CanvasSize } from '@/state/canvas-size-store';

const INTERPOLATION_MS = 100;
const LABEL_OFFSET = 12;

/**
 * Arrow shape of the remote cursor, tip at the origin, pointing bottom-right.
 */
const ARROW_POINTS = [0, 0, 0, 16, 4.5, 11.5, 7.5, 17.5, 10, 16.5, 7, 10.5, 12, 10.5];

type RemotePeer = { clientId: number; user: PresenceUser; cursor: Point | null };

type RemoteCursorProps = {
  x: number;
  y: number;
  zoom: number;
  user: PresenceUser;
};

/**
 * A remote cursor: an arrow in the user color with a name label, offset to the
 * bottom-right of the tip (UI-BOARD-12). It is drawn in world coordinates but
 * inverse-scaled so it keeps a constant screen size.
 */
function RemoteCursor({ x, y, zoom, user }: RemoteCursorProps) {
  const labelColor = readProjectToken('--cursor-label-text');
  return (
    <Group x={x} y={y} scaleX={1 / zoom} scaleY={1 / zoom} listening={false}>
      <Line points={ARROW_POINTS} closed fill={user.color} stroke={labelColor} strokeWidth={1} />
      <Label x={LABEL_OFFSET} y={LABEL_OFFSET}>
        <Tag fill={user.color} cornerRadius={4} />
        <Text text={user.name} fontSize={12} fill={labelColor} padding={4} />
      </Label>
    </Group>
  );
}

type RemoteCursorsProps = {
  provider: HocuspocusProvider;
  viewport: Viewport;
  size: CanvasSize;
};

/**
 * Renders the cursors of the other users, interpolated between the positions
 * received through the awareness state (F10-S2, FL-4). Cursors outside the
 * visible canvas are not drawn (F10-S2-AC3).
 */
export function RemoteCursors({ provider, viewport, size }: RemoteCursorsProps) {
  const [peers, setPeers] = useState<RemotePeer[]>([]);

  useEffect(() => {
    const awareness = provider.awareness;
    if (awareness === null) {
      setPeers([]);
      return;
    }
    const targets = new Map<number, { user: PresenceUser; cursor: Point | null }>();
    const motions = new Map<number, { from: Point; to: Point; start: number; current: Point }>();
    let frame = 0;
    let running = false;

    const readTargets = (): void => {
      targets.clear();
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === provider.document.clientID) {
          continue;
        }
        const parsed = parsePresenceState(state);
        if (parsed !== null) {
          targets.set(clientId, { user: parsed.user, cursor: parsed.cursor });
        }
      }
    };

    const step = (time: number): void => {
      const nextPeers: RemotePeer[] = [];
      let moving = false;
      for (const [clientId, target] of targets) {
        if (target.cursor === null) {
          motions.delete(clientId);
          nextPeers.push({ clientId, user: target.user, cursor: null });
          continue;
        }
        let motion = motions.get(clientId);
        if (motion === undefined) {
          motion = { from: target.cursor, to: target.cursor, start: time, current: target.cursor };
          motions.set(clientId, motion);
        } else if (motion.to.x !== target.cursor.x || motion.to.y !== target.cursor.y) {
          motion.from = motion.current;
          motion.to = target.cursor;
          motion.start = time;
        }
        const progress = (time - motion.start) / INTERPOLATION_MS;
        motion.current = interpolatePoint(motion.from, motion.to, progress);
        if (progress < 1) {
          moving = true;
        }
        nextPeers.push({ clientId, user: target.user, cursor: motion.current });
      }
      for (const clientId of [...motions.keys()]) {
        if (!targets.has(clientId)) {
          motions.delete(clientId);
        }
      }
      setPeers(nextPeers);
      if (moving) {
        frame = requestAnimationFrame(step);
      } else {
        running = false;
      }
    };

    const onChange = (): void => {
      readTargets();
      if (!running) {
        running = true;
        frame = requestAnimationFrame(step);
      }
    };

    awareness.on('change', onChange);
    awareness.on('update', onChange);
    onChange();
    return () => {
      awareness.off('change', onChange);
      awareness.off('update', onChange);
      cancelAnimationFrame(frame);
    };
  }, [provider]);

  return (
    <>
      {peers.map((peer) => {
        if (peer.cursor === null) {
          return null;
        }
        const screen = worldToScreen(viewport, peer.cursor);
        if (!isPointVisible(screen, size)) {
          return null;
        }
        return (
          <RemoteCursor
            key={peer.clientId}
            x={peer.cursor.x}
            y={peer.cursor.y}
            zoom={viewport.zoom}
            user={peer.user}
          />
        );
      })}
    </>
  );
}
