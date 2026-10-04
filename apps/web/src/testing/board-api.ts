import type { HocuspocusProvider } from '@hocuspocus/provider';
import {
  type BoardDoc,
  DEFAULT_VIEWPORT,
  getElement,
  getElements,
  isPointVisible,
  type Point,
  parsePresenceState,
  type ShapeType,
  screenToWorld,
  unionBounds,
  type Viewport,
  worldToScreen,
} from '@mozaik/model';
import { HANDLE_SIZE, selectionHandles } from '@/canvas/selection-handles';

export type OverlayBox = { x: number; y: number; width: number; height: number };

export type WorldBox = { x: number; y: number; width: number; height: number };

export type OverlayBoxes = {
  selection: OverlayBox | null;
  handles: OverlayBox[];
  cursors: Point[];
};

export type DraftShape =
  | {
      type: ShapeType;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number };

export type BoardApi = {
  getElements: () => unknown[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
  screenToWorld: (point: Point) => Point;
  getSelection: () => string[];
  getPeers: () => unknown[];
  getOverlayBoxes: () => OverlayBoxes;
  getDraftShape: () => DraftShape | null;
};

function toScreenBox(viewport: Viewport, box: WorldBox): OverlayBox {
  const topLeft = worldToScreen(viewport, { x: box.x, y: box.y });
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: box.width * viewport.zoom,
    height: box.height * viewport.zoom,
  };
}

function handleBoxes(selection: OverlayBox): OverlayBox[] {
  const half = HANDLE_SIZE / 2;
  return selectionHandles(selection).map((handle) => ({
    x: handle.x - half,
    y: handle.y - half,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  }));
}

/**
 * Converts the selection box and remote cursors from world to screen coordinates.
 */
export function computeOverlayBoxes(input: {
  viewport: Viewport;
  selection: WorldBox | null;
  cursors: Point[];
  arrow?: { from: Point; to: Point } | null;
}): OverlayBoxes {
  const cursors = input.cursors.map((cursor) => worldToScreen(input.viewport, cursor));
  if (input.arrow != null) {
    const half = HANDLE_SIZE / 2;
    const handles = [input.arrow.from, input.arrow.to].map((point) => {
      const screen = worldToScreen(input.viewport, point);
      return { x: screen.x - half, y: screen.y - half, width: HANDLE_SIZE, height: HANDLE_SIZE };
    });
    return { selection: null, handles, cursors };
  }
  const selection = input.selection === null ? null : toScreenBox(input.viewport, input.selection);
  return {
    selection,
    handles: selection === null ? [] : handleBoxes(selection),
    cursors,
  };
}

export type BoardApiDependencies = {
  doc: BoardDoc;
  provider: HocuspocusProvider | null;
  getViewport?: () => Viewport;
  getSelection?: () => string[];
  getCanvasSize?: () => { width: number; height: number };
  getDraftShape?: () => DraftShape | null;
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
  getDraftShape = () => null,
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
      const selected = getSelection()
        .map((id) => getElement(doc, id))
        .filter((element) => element !== undefined);
      const single = selected.length === 1 ? selected[0] : undefined;
      const arrow =
        single !== undefined && single.type === 'arrow'
          ? { from: { x: single.x1, y: single.y1 }, to: { x: single.x2, y: single.y2 } }
          : null;
      const boxes = selected.map((element) => ({
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      }));
      return computeOverlayBoxes({
        viewport,
        selection: unionBounds(boxes),
        cursors,
        arrow,
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
    getDraftShape: () => getDraftShape(),
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
