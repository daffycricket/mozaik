import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import { createBoardHistory } from './history';
import { createElement, getElement, moveElements } from './ops';

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
