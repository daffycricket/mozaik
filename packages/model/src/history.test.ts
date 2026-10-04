import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';
import { createBoardDoc } from './doc';
import { createBoardHistory } from './history';
import { createElement, getElement, getElements, moveElements } from './ops';

describe('[F07-S2-AC3] single undo entry per drag', () => {
  test('[F07-S2-AC3] restores the start position with a single undo after several move transactions', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    const history = createBoardHistory(doc);

    history.stopCapturing();
    for (let step = 1; step <= 10; step += 1) {
      moveElements(doc, ['s1'], { x: 5, y: 3 });
    }
    history.stopCapturing();

    expect(getElement(doc, 's1')).toMatchObject({ x: 50, y: 30 });
    history.undo();
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });
    history.destroy();
    doc.destroy();
  });

  test('[F07-S2-AC3] keeps two gestures separated by a stopCapturing as two undo entries', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    const history = createBoardHistory(doc);

    history.stopCapturing();
    moveElements(doc, ['s1'], { x: 10, y: 0 });
    moveElements(doc, ['s1'], { x: 10, y: 0 });
    history.stopCapturing();
    moveElements(doc, ['s1'], { x: 0, y: 20 });
    history.stopCapturing();

    expect(getElement(doc, 's1')).toMatchObject({ x: 20, y: 20 });
    history.undo();
    expect(getElement(doc, 's1')).toMatchObject({ x: 20, y: 0 });
    history.undo();
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });
    history.destroy();
    doc.destroy();
  });
});

describe('[F08-S2-AC1] undo and redo', () => {
  test('[F08-S2-AC1] undoes a move then a creation, then redoes the creation', () => {
    const doc = createBoardDoc();
    const history = createBoardHistory(doc);

    history.stopCapturing();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 's1', createdBy: 'u' },
    );
    history.stopCapturing();
    moveElements(doc, ['s1'], { x: 40, y: 20 });
    history.stopCapturing();

    expect(getElement(doc, 's1')).toMatchObject({ x: 40, y: 20 });

    history.undo();
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });

    history.undo();
    expect(getElement(doc, 's1')).toBeUndefined();

    history.redo();
    expect(getElement(doc, 's1')).toMatchObject({ x: 0, y: 0 });

    history.destroy();
    doc.destroy();
  });
});

describe('[F08-S2-AC2] isolation between users', () => {
  test('[F08-S2-AC2] undoing a local creation leaves the remote element untouched', () => {
    const doc = createBoardDoc();
    const history = createBoardHistory(doc);

    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100 },
      { id: 'a', createdBy: 'user-1' },
    );
    history.stopCapturing();

    const remote = createBoardDoc();
    createElement(
      remote,
      { type: 'sticky', x: 200, y: 0, width: 100, height: 100 },
      { id: 'b', createdBy: 'user-2' },
    );
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote), 'remote');

    expect(
      getElements(doc)
        .map((element) => element.id)
        .sort(),
    ).toEqual(['a', 'b']);

    history.undo();

    expect(getElement(doc, 'a')).toBeUndefined();
    expect(getElement(doc, 'b')).toBeDefined();

    history.destroy();
    remote.destroy();
    doc.destroy();
  });
});
