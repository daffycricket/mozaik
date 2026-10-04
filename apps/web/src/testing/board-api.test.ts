import { createBoardDoc, createElement } from '@mozaik/model';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  computeOverlayBoxes,
  createBoardApi,
  exposeBoardApi,
  isE2E,
  readRemoteCursors,
} from './board-api';

function fakeProvider(states: Array<[number, unknown]>) {
  return {
    awareness: {
      getStates: () => new Map<number, unknown>(states),
    },
  } as unknown as Parameters<typeof createBoardApi>[0]['provider'];
}

describe('[T-003-AC4] board testing API', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('[T-003-AC4] reads elements, viewport, conversions, selection and peers', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 1, y: 2, width: 10, height: 10, text: 'a' },
      { id: 'e1', createdBy: 'u' },
    );
    const api = createBoardApi({
      doc,
      provider: fakeProvider([
        [doc.clientID, { self: true }],
        [doc.clientID + 1, { name: 'b' }],
      ]),
    });

    expect(api.getElements()).toHaveLength(1);
    expect(api.getViewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(api.worldToScreen({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
    expect(api.screenToWorld({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
    expect(api.getSelection()).toEqual([]);
    expect(api.getPeers()).toEqual([{ name: 'b' }]);
    doc.destroy();
  });

  test('[T-003-AC4] reports no peers without a provider', () => {
    const doc = createBoardDoc();
    const api = createBoardApi({ doc, provider: null });
    expect(api.getPeers()).toEqual([]);
    doc.destroy();
  });

  test('[T-003-AC4] exposes the API on window only in end-to-end mode', () => {
    vi.stubGlobal('window', {});
    const api = createBoardApi({ doc: createBoardDoc(), provider: null });

    exposeBoardApi(api);
    expect((window as unknown as { __board?: unknown }).__board).toBeUndefined();

    vi.stubEnv('VITE_E2E', '1');
    expect(isE2E()).toBe(true);
    exposeBoardApi(api);
    expect((window as unknown as { __board?: unknown }).__board).toBe(api);
  });
});

describe('[T-006-AC6] overlay boxes', () => {
  test('[T-006-AC6] converts the selection, its eight handles and the cursors to screen boxes', () => {
    const boxes = computeOverlayBoxes({
      viewport: { x: 0, y: 0, zoom: 2 },
      selection: { x: 10, y: 20, width: 100, height: 50 },
      cursors: [{ x: 5, y: 5 }],
    });

    expect(boxes.selection).toEqual({ x: 20, y: 40, width: 200, height: 100 });
    expect(boxes.handles).toHaveLength(8);
    expect(boxes.handles[0]).toEqual({ x: 16, y: 36, width: 8, height: 8 });
    expect(boxes.cursors).toEqual([{ x: 10, y: 10 }]);
  });

  test('[T-006-AC6] returns empty overlay boxes without a selection', () => {
    const doc = createBoardDoc();
    const api = createBoardApi({ doc, provider: null });
    expect(api.getOverlayBoxes()).toEqual({ selection: null, handles: [], cursors: [] });
    doc.destroy();
  });
});

const peerState = (cursor: { x: number; y: number } | null) => ({
  user: { id: 'peer', name: 'Nico L', color: '#E11D48' },
  cursor,
});

describe('[F10-S2-AC1] remote cursors', () => {
  test('[F10-S2-AC1] reads the cursors of the other users only', () => {
    const doc = createBoardDoc();
    const cursors = readRemoteCursors(
      fakeProvider([
        [doc.clientID, peerState({ x: 1, y: 1 })],
        [doc.clientID + 1, peerState({ x: 20, y: 30 })],
        [doc.clientID + 2, { name: 'invalid' }],
        [doc.clientID + 3, peerState(null)],
      ]),
      doc.clientID,
    );
    expect(cursors).toEqual([{ x: 20, y: 30 }]);
    doc.destroy();
  });

  test('[F10-S2-AC1] reports no cursors without a provider', () => {
    expect(readRemoteCursors(null, 1)).toEqual([]);
  });
});

describe('[F10-S2-AC3] cursor visibility in overlay boxes', () => {
  test('[F10-S2-AC3] exposes a visible remote cursor at its screen position', () => {
    const doc = createBoardDoc();
    const api = createBoardApi({
      doc,
      provider: fakeProvider([[doc.clientID + 1, peerState({ x: 100, y: 50 })]]),
      getCanvasSize: () => ({ width: 1280, height: 752 }),
    });
    expect(api.getOverlayBoxes().cursors).toEqual([{ x: 100, y: 50 }]);
    doc.destroy();
  });

  test('[F10-S2-AC3] hides a remote cursor outside the canvas', () => {
    const doc = createBoardDoc();
    const api = createBoardApi({
      doc,
      provider: fakeProvider([[doc.clientID + 1, peerState({ x: 100, y: 50 })]]),
      getCanvasSize: () => ({ width: 50, height: 50 }),
    });
    expect(api.getOverlayBoxes().cursors).toEqual([]);
    doc.destroy();
  });
});
