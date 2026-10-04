import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';
import { createBoardDoc } from './doc';
import {
  bringForward,
  canBringForward,
  canSendBackward,
  createElement,
  getElements,
  LOCAL_ORIGIN,
  sendBackward,
} from './ops';
import { canReorder, reorderStep, sortByZIndex } from './order';

function board(ids: string[]): ReturnType<typeof createBoardDoc> {
  const doc = createBoardDoc();
  ids.forEach((id, index) => {
    createElement(
      doc,
      { type: 'sticky', x: index * 120, y: 0, width: 100, height: 100 },
      { id, createdBy: 'u', zIndex: `a${index}` },
    );
  });
  return doc;
}

function orderOf(doc: ReturnType<typeof createBoardDoc>): string[] {
  return sortByZIndex(getElements(doc)).map((element) => element.id);
}

function step(
  doc: ReturnType<typeof createBoardDoc>,
  ids: string[],
  direction: 'forward' | 'backward',
) {
  const next = reorderStep(getElements(doc), ids, direction);
  return [...next.keys()];
}

describe('[F07-S4-AC1] move forward', () => {
  test('[F07-S4-AC1] moves a selected element one step towards the top', () => {
    const doc = board(['a', 'b', 'c']);
    bringForward(doc, ['a']);

    expect(orderOf(doc)).toEqual(['b', 'a', 'c']);
    doc.destroy();
  });

  test('[F07-S4-AC1] writes the moved element in one local transaction', () => {
    const doc = board(['a', 'b', 'c']);
    const origins: unknown[] = [];
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });

    bringForward(doc, ['a']);

    expect(origins).toEqual([LOCAL_ORIGIN]);
    doc.destroy();
  });
});

describe('[F07-S4-AC2] move backward', () => {
  test('[F07-S4-AC2] moves a selected element one step towards the bottom', () => {
    const doc = board(['a', 'b', 'c']);
    sendBackward(doc, ['c']);

    expect(orderOf(doc)).toEqual(['a', 'c', 'b']);
    doc.destroy();
  });
});

describe('[F07-S4-AC3] stacking limits', () => {
  test('[F07-S4-AC3] does nothing when the element is already on top', () => {
    const doc = board(['a', 'b', 'c']);
    bringForward(doc, ['c']);

    expect(orderOf(doc)).toEqual(['a', 'b', 'c']);
    expect(canBringForward(doc, ['c'])).toBe(false);
    doc.destroy();
  });

  test('[F07-S4-AC3] does nothing when the element is already at the bottom', () => {
    const doc = board(['a', 'b', 'c']);
    sendBackward(doc, ['a']);

    expect(orderOf(doc)).toEqual(['a', 'b', 'c']);
    expect(canSendBackward(doc, ['a'])).toBe(false);
    doc.destroy();
  });

  test('[F07-S4-AC3] enables a direction as soon as one element can move', () => {
    const doc = board(['a', 'b', 'c']);
    expect(canBringForward(doc, ['a'])).toBe(true);
    expect(canSendBackward(doc, ['c'])).toBe(true);
    expect(canReorder(getElements(doc), ['a', 'b', 'c'], 'forward')).toBe(false);
    doc.destroy();
  });
});

describe('[F07-S4-AC4] multiple selection', () => {
  test('[F07-S4-AC4] moves each selected element while preserving their relative order', () => {
    const doc = board(['a', 'b', 'c', 'd']);
    bringForward(doc, ['a', 'b', 'c']);

    expect(orderOf(doc)).toEqual(['d', 'a', 'b', 'c']);
    doc.destroy();
  });

  test('[F07-S4-AC4] moves a non-contiguous selection one step each', () => {
    const doc = board(['a', 'b', 'c', 'd']);
    bringForward(doc, ['a', 'c']);

    expect(orderOf(doc)).toEqual(['b', 'a', 'd', 'c']);
    doc.destroy();
  });

  test('[F07-S4-AC4] only lists the elements that actually move', () => {
    const doc = board(['a', 'b', 'c', 'd']);
    expect(step(doc, ['a', 'c'], 'forward').sort()).toEqual(['a', 'c']);
    expect(step(doc, ['a', 'b', 'c'], 'forward').sort()).toEqual(['a', 'b', 'c']);
    doc.destroy();
  });
});

describe('[F07-S4-AC5] concurrent order', () => {
  test('[F07-S4-AC5] converges when two users advance a different element at once', () => {
    const docA = board(['a', 'b', 'c']);
    const docB = createBoardDoc();
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    bringForward(docA, ['a']);
    bringForward(docB, ['b']);

    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    expect(orderOf(docA)).toEqual(orderOf(docB));
    expect(orderOf(docA)).toEqual(['a', 'c', 'b']);

    docA.destroy();
    docB.destroy();
  });
});
