import { describe, expect, test, vi } from 'vitest';
import * as Y from 'yjs';
import { createBoardDoc } from './doc';
import {
  createElement,
  deleteElements,
  ELEMENTS_KEY,
  getElement,
  getElements,
  LOCAL_ORIGIN,
  updateElement,
} from './ops';

describe('[T-003-AC1] element operations', () => {
  test('[T-003-AC1] creates a sticky note with defaults', () => {
    const doc = createBoardDoc();
    const element = createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 100, height: 80 },
      { id: 'e1', createdBy: 'user-1' },
    );

    expect(element).toEqual({
      id: 'e1',
      type: 'sticky',
      x: 10,
      y: 20,
      width: 100,
      height: 80,
      zIndex: 'a0',
      createdBy: 'user-1',
      text: '',
      color: 'yellow',
    });
    expect(getElements(doc)).toEqual([element]);
    doc.destroy();
  });

  test('[T-003-AC1] creates every element type with its specific defaults', () => {
    const doc = createBoardDoc();
    const text = createElement(
      doc,
      { type: 'text', x: 0, y: 0, width: 50, height: 20, text: 'Titre', color: 'red' },
      { id: 't1', createdBy: 'u' },
    );
    expect(text).toMatchObject({ type: 'text', text: 'Titre', color: 'red' });
    const ellipse = createElement(
      doc,
      { type: 'ellipse', x: 0, y: 0, width: 30, height: 30 },
      { id: 'o1', createdBy: 'u' },
    );
    expect(ellipse).toMatchObject({ type: 'ellipse' });
    const defaultText = createElement(
      doc,
      { type: 'text', x: 0, y: 0, width: 10, height: 10 },
      { id: 't2', createdBy: 'u' },
    );
    expect(defaultText).toMatchObject({ text: '', color: 'black' });
    doc.destroy();
  });

  test('[T-003-AC1] writes each element through a local transaction', () => {
    const doc = createBoardDoc();
    const origins: unknown[] = [];
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });

    createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'e1', createdBy: 'u' },
    );
    updateElement(doc, 'e1', { x: 5 });
    deleteElements(doc, ['e1']);

    expect(origins).toContain(LOCAL_ORIGIN);
    doc.destroy();
  });

  test('[T-003-AC1] stacks new elements with increasing fractional keys', () => {
    const doc = createBoardDoc();
    const first = createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'e1', createdBy: 'u' },
    );
    const second = createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'e2', createdBy: 'u' },
    );
    expect(second.zIndex > first.zIndex).toBe(true);
    doc.destroy();
  });

  test('[T-003-AC1] derives the bounding box of an arrow', () => {
    const doc = createBoardDoc();
    const arrow = createElement(
      doc,
      { type: 'arrow', x1: 30, y1: 40, x2: 10, y2: 10 },
      { id: 'a1', createdBy: 'u' },
    );
    expect(arrow).toMatchObject({ x: 10, y: 10, width: 20, height: 30, x1: 30, y1: 40 });
    doc.destroy();
  });

  test('[T-003-AC1] updates properties and recomputes arrow bounds', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10 },
      { id: 'a1', createdBy: 'u' },
    );
    updateElement(doc, 'a1', { x2: 40, y2: 5 });
    expect(getElement(doc, 'a1')).toMatchObject({
      x: 0,
      y: 0,
      width: 40,
      height: 5,
      x2: 40,
      y2: 5,
    });
    doc.destroy();
  });

  test('[T-003-AC1] updates a sticky note colour', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 10, height: 10 },
      { id: 's1', createdBy: 'u' },
    );
    updateElement(doc, 's1', { color: 'blue', text: 'idée' });
    expect(getElement(doc, 's1')).toMatchObject({ color: 'blue', text: 'idée' });
    doc.destroy();
  });

  test('[T-003-AC1] reports and ignores an update on a missing element', () => {
    const doc = createBoardDoc();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateElement(doc, 'missing', { x: 1 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    doc.destroy();
  });

  test('[T-003-AC1] deletes several elements in one transaction', () => {
    const doc = createBoardDoc();
    createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'e1', createdBy: 'u' },
    );
    createElement(
      doc,
      { type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'e2', createdBy: 'u' },
    );
    deleteElements(doc, ['e1', 'e2']);
    expect(getElements(doc)).toEqual([]);
    doc.destroy();
  });

  test('[T-003-AC1] ignores and reports a malformed element', () => {
    const doc = createBoardDoc();
    const broken = new Y.Map<unknown>();
    broken.set('id', 'broken');
    broken.set('type', 'sticky');
    doc.transact(() => {
      doc.getMap<Y.Map<unknown>>(ELEMENTS_KEY).set('broken', broken);
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(getElements(doc)).toEqual([]);
    expect(spy).toHaveBeenCalled();
    expect(getElement(doc, 'broken')).toBeUndefined();

    spy.mockRestore();
    doc.destroy();
  });

  test('[T-003-AC1] returns undefined for a missing element', () => {
    const doc = createBoardDoc();
    expect(getElement(doc, 'nope')).toBeUndefined();
    doc.destroy();
  });
});
