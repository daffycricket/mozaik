import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import {
  CLIPBOARD_PREFIX,
  COPY_OFFSET,
  createElement,
  duplicateElements,
  getElement,
  getElements,
  parseElements,
  pasteElements,
  serializeElements,
} from './ops';
import type { Element } from './schema';

function mustGet(doc: ReturnType<typeof createBoardDoc>, id: string): Element {
  const element = getElement(doc, id);
  if (element === undefined) {
    throw new Error(`Expected element "${id}"`);
  }
  return element;
}

function seed(doc: ReturnType<typeof createBoardDoc>): Element[] {
  createElement(
    doc,
    { type: 'sticky', x: 0, y: 0, width: 100, height: 100, text: 'note', color: 'blue' },
    { id: 's', createdBy: 'user-1' },
  );
  createElement(
    doc,
    { type: 'text', x: 200, y: 0, width: 60, height: 24, text: 'hello', color: 'red' },
    { id: 't', createdBy: 'user-1' },
  );
  createElement(
    doc,
    { type: 'arrow', x1: 0, y1: 300, x2: 100, y2: 400 },
    { id: 'a', createdBy: 'user-1' },
  );
  return getElements(doc);
}

function counter(): () => string {
  let index = 0;
  return () => {
    const id = `copy-${index}`;
    index += 1;
    return id;
  };
}

describe('[F08-S3-AC1] duplicate', () => {
  test('[F08-S3-AC1] copies the selection with new ids, an offset and a zIndex above the originals', () => {
    const doc = createBoardDoc();
    const originals = seed(doc);
    const ids = duplicateElements(doc, ['s', 't', 'a'], {
      createdBy: 'user-2',
      offset: COPY_OFFSET,
      generateId: counter(),
    });

    expect(ids).toEqual(['copy-0', 'copy-1', 'copy-2']);
    expect(getElements(doc)).toHaveLength(6);

    for (const original of originals) {
      expect(mustGet(doc, original.id)).toEqual(original);
    }

    expect(mustGet(doc, 'copy-0')).toMatchObject({
      type: 'sticky',
      x: 20,
      y: 20,
      text: 'note',
      color: 'blue',
      createdBy: 'user-2',
    });
    expect(mustGet(doc, 'copy-1')).toMatchObject({
      type: 'text',
      x: 220,
      y: 20,
      text: 'hello',
      color: 'red',
      createdBy: 'user-2',
    });
    expect(mustGet(doc, 'copy-2')).toMatchObject({
      type: 'arrow',
      x1: 20,
      y1: 320,
      x2: 120,
      y2: 420,
      createdBy: 'user-2',
    });

    const highestOriginal = originals
      .map((element) => element.zIndex)
      .sort()
      .at(-1) as string;
    const copyKeys = ids.map((id) => mustGet(doc, id).zIndex);
    for (const key of copyKeys) {
      expect(key > highestOriginal).toBe(true);
    }
    expect(copyKeys).toEqual([...copyKeys].sort());
  });

  test('[F08-S3-AC1] ignores missing ids and copies nothing without a selection', () => {
    const doc = createBoardDoc();
    seed(doc);
    expect(
      duplicateElements(doc, ['missing'], {
        createdBy: 'user-2',
        offset: COPY_OFFSET,
        generateId: counter(),
      }),
    ).toEqual([]);
    expect(getElements(doc)).toHaveLength(3);
  });
});

describe('[F08-S3-AC2] copy and paste', () => {
  test('[F08-S3-AC2] pasting a serialized selection matches a duplication', () => {
    const source = createBoardDoc();
    const originals = seed(source);
    const payload = serializeElements(originals);
    const parsed = parseElements(payload);
    if (parsed === null) {
      throw new Error('Expected a valid clipboard payload');
    }
    const pastedIds = pasteElements(source, parsed, {
      createdBy: 'user-2',
      offset: COPY_OFFSET,
      generateId: counter(),
    });

    const duplicatedDoc = createBoardDoc();
    seed(duplicatedDoc);
    const duplicatedIds = duplicateElements(duplicatedDoc, ['s', 't', 'a'], {
      createdBy: 'user-2',
      offset: COPY_OFFSET,
      generateId: counter(),
    });

    expect(pastedIds).toEqual(duplicatedIds);
    expect(pastedIds.map((id) => mustGet(source, id))).toEqual(
      duplicatedIds.map((id) => mustGet(duplicatedDoc, id)),
    );
  });

  test('[F08-S3-AC2] rejects external text and malformed payloads', () => {
    expect(parseElements('hello')).toBeNull();
    expect(parseElements(`${CLIPBOARD_PREFIX}{bad`)).toBeNull();
    expect(parseElements(`${CLIPBOARD_PREFIX}[{"id":""}]`)).toBeNull();
  });
});

describe('[F08-S3-AC3] paste into another board', () => {
  test('[F08-S3-AC3] creates the elements with new identifiers in the target board', () => {
    const source = createBoardDoc();
    seed(source);
    const payload = serializeElements(getElements(source));
    const parsed = parseElements(payload);
    if (parsed === null) {
      throw new Error('Expected a valid clipboard payload');
    }

    const target = createBoardDoc();
    const ids = pasteElements(target, parsed, {
      createdBy: 'user-2',
      offset: COPY_OFFSET,
      generateId: counter(),
    });

    expect(ids).toEqual(['copy-0', 'copy-1', 'copy-2']);
    expect(getElements(target)).toHaveLength(3);
    expect(mustGet(target, 'copy-0')).toMatchObject({
      type: 'sticky',
      x: 20,
      y: 20,
      createdBy: 'user-2',
    });
    expect(getElement(target, 's')).toBeUndefined();
  });
});
