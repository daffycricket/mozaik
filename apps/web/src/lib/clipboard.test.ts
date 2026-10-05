// @vitest-environment happy-dom
import {
  createBoardDoc,
  createElement,
  type Element,
  getElements,
  serializeElements,
} from '@mozaik/model';
import { beforeEach, describe, expect, test, vi } from 'vitest';

function sticky(id: string, x = 0): Element {
  const doc = createBoardDoc();
  createElement(doc, { type: 'sticky', x, y: 0, width: 10, height: 10 }, { id, createdBy: 'u' });
  const [element] = getElements(doc);
  if (element === undefined) {
    throw new Error('Expected an element');
  }
  return element;
}

function installClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

beforeEach(() => {
  vi.resetModules();
  installClipboard(undefined);
});

describe('[F08-S3] clipboard', () => {
  test('[F08-S3-AC2] writes the prefixed payload to the system clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboard({ writeText, readText: vi.fn().mockRejectedValue(new Error('denied')) });
    const { writeClipboard } = await import('./clipboard');
    const elements = [sticky('a')];

    await writeClipboard(elements);

    expect(writeText).toHaveBeenCalledWith(serializeElements(elements));
  });

  test('[F08-S3-AC2] falls back to memory when the system clipboard refuses the access', async () => {
    installClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
      readText: vi.fn().mockRejectedValue(new Error('denied')),
    });
    const { readClipboard, writeClipboard } = await import('./clipboard');
    const elements = [sticky('a')];

    await writeClipboard(elements);

    expect(await readClipboard()).toEqual(elements);
  });

  test('[F08-S3-AC2] prefers a valid system clipboard payload', async () => {
    const system = [sticky('system', 40)];
    installClipboard({
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(serializeElements(system)),
    });
    const { readClipboard } = await import('./clipboard');

    expect(await readClipboard()).toEqual(system);
  });

  test('[F08-S3-AC2] ignores external clipboard text and falls back to memory', async () => {
    installClipboard({
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('du texte externe'),
    });
    const { readClipboard, writeClipboard } = await import('./clipboard');
    const elements = [sticky('a')];

    await writeClipboard(elements);

    expect(await readClipboard()).toEqual(elements);
  });

  test('[F08-S3-AC2] returns null when nothing can be pasted', async () => {
    installClipboard({
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('du texte externe'),
    });
    const { readClipboard } = await import('./clipboard');

    expect(await readClipboard()).toBeNull();
  });
});
