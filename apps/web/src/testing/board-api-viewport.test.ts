import { createBoardDoc, type Viewport } from '@mozaik/model';
import { describe, expect, test } from 'vitest';
import { createBoardApi } from './board-api';

describe('[F02-S1-AC1] board testing API viewport', () => {
  test('[F02-S1-AC1] uses the injected viewport for conversions and overlay boxes', () => {
    const doc = createBoardDoc();
    let viewport: Viewport = { x: 0, y: 0, zoom: 1 };
    const api = createBoardApi({ doc, provider: null, getViewport: () => viewport });

    expect(api.getViewport()).toEqual({ x: 0, y: 0, zoom: 1 });

    viewport = { x: 10, y: 20, zoom: 2 };
    expect(api.getViewport()).toEqual(viewport);
    expect(api.worldToScreen({ x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
    expect(api.screenToWorld({ x: 0, y: 0 })).toEqual({ x: 10, y: 20 });
    expect(api.getOverlayBoxes()).toEqual({ selection: null, handles: [], cursors: [] });

    doc.destroy();
  });
});
