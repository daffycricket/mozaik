import { createBoardDoc, createElement } from '@mozaik/model';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createBoardApi, exposeBoardApi, isE2E } from './board-api';

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
