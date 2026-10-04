import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import type { Box } from './geometry';
import { type Element, elementSchema, type PaletteColor, STICKY_DEFAULT_SIZE } from './schema';
import type { Point } from './viewport';

/**
 * Marker of the transactions written by the local user, tracked by the undo manager.
 */
export const LOCAL_ORIGIN = Symbol('mozaik:local');

export const ELEMENTS_KEY = 'elements';

export type ElementInit =
  | {
      type: 'sticky';
      x: number;
      y: number;
      width: number;
      height: number;
      text?: string;
      color?: PaletteColor;
    }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'ellipse'; x: number; y: number; width: number; height: number }
  | {
      type: 'text';
      x: number;
      y: number;
      width: number;
      height: number;
      text?: string;
      color?: PaletteColor;
    }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number };

export type CreateElementOptions = {
  id: string;
  createdBy: string;
  zIndex?: string;
};

export type ElementPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: string;
  text: string;
  color: PaletteColor;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}>;

function elementsMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>(ELEMENTS_KEY);
}

/**
 * Returns the valid elements of the document, ignoring the malformed ones.
 */
export function getElements(doc: Y.Doc): Element[] {
  const result: Element[] = [];
  elementsMap(doc).forEach((value, key) => {
    const parsed = elementSchema.safeParse(value.toJSON());
    if (!parsed.success) {
      console.error(`Ignoring invalid board element "${key}"`, parsed.error);
      return;
    }
    result.push(parsed.data);
  });
  return result;
}

/**
 * Returns one element by id, or undefined when it is missing or invalid.
 */
export function getElement(doc: Y.Doc, id: string): Element | undefined {
  const value = elementsMap(doc).get(id);
  if (value === undefined) {
    return undefined;
  }
  const parsed = elementSchema.safeParse(value.toJSON());
  return parsed.success ? parsed.data : undefined;
}

/**
 * Returns the topmost element whose bounding box contains the world point, or
 * `undefined` when the point hits nothing (F03-S2-AC1).
 */
export function elementAtPoint(elements: Element[], point: Point): Element | undefined {
  let hit: Element | undefined;
  for (const element of elements) {
    if (
      point.x < element.x ||
      point.x > element.x + element.width ||
      point.y < element.y ||
      point.y > element.y + element.height
    ) {
      continue;
    }
    if (hit === undefined || element.zIndex > hit.zIndex) {
      hit = element;
    }
  }
  return hit;
}

/**
 * Returns the elements entirely contained in the box, ignoring the ones that
 * only overlap it. Used by the selection rectangle (F07-S1-AC3).
 */
export function elementsInBox(elements: Element[], box: Box): Element[] {
  return elements.filter(
    (element) =>
      element.x >= box.x &&
      element.y >= box.y &&
      element.x + element.width <= box.x + box.width &&
      element.y + element.height <= box.y + box.height,
  );
}

function nextZIndex(doc: Y.Doc): string {
  const keys = getElements(doc)
    .map((element) => element.zIndex)
    .sort();
  return generateKeyBetween(keys.at(-1) ?? null, null);
}

function arrowBounds(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

function buildElement(init: ElementInit, options: CreateElementOptions, zIndex: string): Element {
  switch (init.type) {
    case 'sticky':
      return {
        id: options.id,
        type: 'sticky',
        x: init.x,
        y: init.y,
        width: init.width,
        height: init.height,
        zIndex,
        createdBy: options.createdBy,
        text: init.text ?? '',
        color: init.color ?? 'yellow',
      };
    case 'text':
      return {
        id: options.id,
        type: 'text',
        x: init.x,
        y: init.y,
        width: init.width,
        height: init.height,
        zIndex,
        createdBy: options.createdBy,
        text: init.text ?? '',
        color: init.color ?? 'black',
      };
    case 'rect':
    case 'ellipse':
      return {
        id: options.id,
        type: init.type,
        x: init.x,
        y: init.y,
        width: init.width,
        height: init.height,
        zIndex,
        createdBy: options.createdBy,
      };
    case 'arrow':
      return {
        id: options.id,
        type: 'arrow',
        ...arrowBounds(init.x1, init.y1, init.x2, init.y2),
        zIndex,
        createdBy: options.createdBy,
        x1: init.x1,
        y1: init.y1,
        x2: init.x2,
        y2: init.y2,
      };
  }
}

/**
 * Creates an element in a local transaction and returns it.
 */
export function createElement(
  doc: Y.Doc,
  init: ElementInit,
  options: CreateElementOptions,
): Element {
  const element = elementSchema.parse(
    buildElement(init, options, options.zIndex ?? nextZIndex(doc)),
  );
  doc.transact(() => {
    const value = new Y.Map<unknown>();
    for (const [key, field] of Object.entries(element)) {
      value.set(key, field);
    }
    elementsMap(doc).set(element.id, value);
  }, LOCAL_ORIGIN);
  return element;
}

/**
 * Creates a yellow sticky note of the default size centered on `center`
 * (F03-S1-AC1) in a local transaction.
 */
export function createSticky(doc: Y.Doc, center: Point, options: CreateElementOptions): Element {
  return createElement(
    doc,
    {
      type: 'sticky',
      x: center.x - STICKY_DEFAULT_SIZE / 2,
      y: center.y - STICKY_DEFAULT_SIZE / 2,
      width: STICKY_DEFAULT_SIZE,
      height: STICKY_DEFAULT_SIZE,
    },
    options,
  );
}

/**
 * Updates the given properties of an element in a local transaction. Only the
 * patched properties are written, so two users editing two different properties
 * of the same element concurrently both apply (F09-S1-AC2, ADR-0004).
 */
export function updateElement(doc: Y.Doc, id: string, patch: ElementPatch): void {
  const map = elementsMap(doc);
  const value = map.get(id);
  if (value === undefined) {
    console.error(`Cannot update missing board element "${id}"`);
    return;
  }
  const candidate: Record<string, unknown> = { ...value.toJSON(), ...patch };
  const keys = new Set(Object.keys(patch));
  if (candidate.type === 'arrow') {
    const x1 = typeof patch.x1 === 'number' ? patch.x1 : Number(candidate.x1);
    const y1 = typeof patch.y1 === 'number' ? patch.y1 : Number(candidate.y1);
    const x2 = typeof patch.x2 === 'number' ? patch.x2 : Number(candidate.x2);
    const y2 = typeof patch.y2 === 'number' ? patch.y2 : Number(candidate.y2);
    Object.assign(candidate, arrowBounds(x1, y1, x2, y2));
    if (keys.has('x1') || keys.has('y1') || keys.has('x2') || keys.has('y2')) {
      for (const derived of ['x', 'y', 'width', 'height']) {
        keys.add(derived);
      }
    }
  }
  const element = elementSchema.parse(candidate);
  doc.transact(() => {
    for (const [key, field] of Object.entries(element)) {
      if (key === 'id' || key === 'type' || key === 'createdBy' || !keys.has(key)) {
        continue;
      }
      value.set(key, field);
    }
  }, LOCAL_ORIGIN);
}

/**
 * Sets the colour of the given sticky notes and free texts in a single local
 * transaction, so recolouring a multiple selection is one undo entry
 * (F03-S3-AC1). Elements of other types are ignored.
 */
export function setElementsColor(doc: Y.Doc, ids: string[], color: PaletteColor): void {
  const map = elementsMap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const value = map.get(id);
      if (value === undefined) {
        continue;
      }
      const type = value.get('type');
      if (type !== 'sticky' && type !== 'text') {
        continue;
      }
      value.set('color', color);
    }
  }, LOCAL_ORIGIN);
}

/**
 * Deletes the given elements in a single local transaction.
 */
export function deleteElements(doc: Y.Doc, ids: string[]): void {
  const map = elementsMap(doc);
  doc.transact(() => {
    for (const id of ids) {
      map.delete(id);
    }
  }, LOCAL_ORIGIN);
}
