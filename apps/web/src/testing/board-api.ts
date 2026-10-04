import type { HocuspocusProvider } from '@hocuspocus/provider';
import {
  type BoardDoc,
  DEFAULT_VIEWPORT,
  getElements,
  type Point,
  screenToWorld,
  type Viewport,
  worldToScreen,
} from '@mozaik/model';

export type BoardApi = {
  getElements: () => unknown[];
  getViewport: () => Viewport;
  worldToScreen: (point: Point) => Point;
  screenToWorld: (point: Point) => Point;
  getSelection: () => string[];
  getPeers: () => unknown[];
};

export type BoardApiDependencies = {
  doc: BoardDoc;
  provider: HocuspocusProvider | null;
};

/**
 * Tells whether the application runs in end-to-end test mode.
 */
export function isE2E(): boolean {
  return import.meta.env.VITE_E2E === '1';
}

/**
 * Builds the read-only board API exposed to end-to-end tests.
 */
export function createBoardApi({ doc, provider }: BoardApiDependencies): BoardApi {
  return {
    getElements: () => getElements(doc),
    getViewport: () => DEFAULT_VIEWPORT,
    worldToScreen: (point) => worldToScreen(DEFAULT_VIEWPORT, point),
    screenToWorld: (point) => screenToWorld(DEFAULT_VIEWPORT, point),
    getSelection: () => [],
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
