import type { HocuspocusProvider } from '@hocuspocus/provider';
import {
  type BoardDoc,
  DEFAULT_VIEWPORT,
  getElement,
  getElements,
  isPointVisible,
  type Point,
  parsePresenceState,
  screenToWorld,
  unionBounds,
  type Viewport,
  worldToScreen,
} from '@mozaik/model';

export type OverlayBox = { x: number; y: number; width: number; height: number };

export type WorldBox = { x: number; y: number; width: number; height: number };

export type OverlayBoxes = {
  selection: OverlayBox | null;
  handles: OverlayBox[];
  cursors: Point[];
};

export type BoardApi = {
  getElements: () => unknown[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
  screenToWorld: (point: Point) => Point;
  getSelection: () => string[];
  getPeers: () => unknown[];
  getOverlayBoxes: () => OverlayBoxes;
};

const HANDLE_SIZE = 8;

function toScreenBox(viewport: Viewport, box: WorldBox): OverlayBox {
  const topLeft = worldToScreen(viewport, { x: box.x, y: box.y });
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: box.width * viewport.zoom,
    height: box.height * viewport.zoom,
  };
}

/**
 * Builds the eight square handles (corners and side midpoints) of a selection box.
 */
export function selectionHandles(selection: OverlayBox): OverlayBox[] {
  const half = HANDLE_SIZE / 2;
  const handles: OverlayBox[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (row === 1 && column === 1) {
        continue;
      }
      const x = selection.x + (selection.width * column) / 2;
      const y = selection.y + (selection.height * row) / 2;
      handles.push({ x: x - half, y: y - half, width: HANDLE_SIZE, height: HANDLE_SIZE });
    }
  }
  return handles;
}

/**
 * Converts the selection box and remote cursors from world to screen coordinates.
 */
export function computeOverlayBoxes(input: {
  viewport: Viewport;
  selection: WorldBox | null;
  cursors: Point[];
}): OverlayBoxes {
  const selection = input.selection === null ? null : toScreenBox(input.viewport, input.selection);
  return {
    selection,
    handles: selection === null ? [] : selectionHandles(selection),
    cursors: input.cursors.map((cursor) => worldToScreen(input.viewport, cursor)),
  };
}

export type BoardApiDependencies = {
  doc: BoardDoc;
  provider: HocuspocusProvider | null;
  getViewport?: () => Viewport;
  getSelection?: () => string[];
  getCanvasSize?: () => { width: number; height: number };
};

/**
 * Reads the cursor of every other connected user from the awareness state (F10-S2).
 */
export function readRemoteCursors(provider: HocuspocusProvider | null, selfId: number): Point[] {
  const awareness = provider?.awareness;
  if (awareness == null) {
    return [];
  }
  const cursors: Point[] = [];
  for (const [clientId, state] of awareness.getStates()) {
    if (clientId === selfId) {
      continue;
    }
    const parsed = parsePresenceState(state);
    if (parsed?.cursor != null) {
      cursors.push(parsed.cursor);
    }
  }
  return cursors;
}

/**
 * Tells whether the application runs in end-to-end test mode.
 */
export function isE2E(): boolean {
  return import.meta.env.VITE_E2E === '1';
}

/**
 * Builds the read-only board API exposed to end-to-end tests.
 */
export function createBoardApi({
  doc,
  provider,
  getViewport = () => DEFAULT_VIEWPORT,
  getSelection = () => [],
  getCanvasSize = () => ({ width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY }),
}: BoardApiDependencies): BoardApi {
  return {
    getElements: () => getElements(doc),
    getViewport,
    worldToScreen: (point) => worldToScreen(getViewport(), point),
    screenToWorld: (point) => screenToWorld(getViewport(), point),
    getSelection: () => [...getSelection()],
    getOverlayBoxes: () => {
      const viewport = getViewport();
      const size = getCanvasSize();
      const cursors = readRemoteCursors(provider, doc.clientID).filter((cursor) =>
        isPointVisible(worldToScreen(viewport, cursor), size),
      );
      const boxes = getSelection()
        .map((id) => getElement(doc, id))
        .filter((element) => element !== undefined)
        .map((element) => ({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        }));
      return computeOverlayBoxes({
        viewport,
        selection: unionBounds(boxes),
        cursors,
      });
    },
    getPeers: () => {
      const awareness = provider?.awareness;
      if (awareness == null) {
        return [];
      }
      const peers: unknown[] = [];
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId !== doc.clientID) {
          peers.push(state);
        }
      }
      return peers;
    },
  };
}

/**
 * Exposes the board API on window when running in end-to-end test mode.
 */
export function exposeBoardApi(api: BoardApi): void {
  if (!isE2E()) {
    return;
  }
  (window as unknown as { __board?: BoardApi }).__board = api;
}
