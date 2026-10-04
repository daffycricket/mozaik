import { createBoardDoc, createElement } from '@mozaik/model';
import { describe, expect, test } from 'vitest';
import { createBoardApi } from './board-api';

describe('[F03-S1-AC1] board API selection', () => {
  test('[F03-S1-AC1] reports the selection and its overlay box', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 200, height: 200 },
      { id: 's1', createdBy: 'u' },
    );
    const api = createBoardApi({ doc, provider: null, getSelection: () => ['s1'] });

    expect(api.getSelection()).toEqual(['s1']);
    expect(api.getOverlayBoxes().selection).toEqual({
      x: 10,
      y: 20,
      width: 200,
      height: 200,
    });
    expect(api.getOverlayBoxes().handles).toHaveLength(8);

    doc.destroy();
  });

  test('[F03-S1-AC1] returns no selection box for a missing element', () => {
    const doc = createBoardDoc();
    const api = createBoardApi({ doc, provider: null, getSelection: () => ['missing'] });

    expect(api.getOverlayBoxes().selection).toBeNull();

    doc.destroy();
  });
});
