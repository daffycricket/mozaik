import { describe, expect, test } from 'vitest';
import { createBoardDoc } from './doc';
import { LOCAL_ORIGIN } from './ops';
import { MODEL_SCHEMA_VERSION } from './schema';

describe('[T-003-AC1] board document', () => {
  test('[T-003-AC1] creates a document carrying the schema version', () => {
    const doc = createBoardDoc();
    expect(doc.getMap('meta').get('schemaVersion')).toBe(MODEL_SCHEMA_VERSION);
    expect(doc.getMap('elements').size).toBe(0);
    doc.destroy();
  });

  test('[T-003-AC1] writes the schema version with the local origin', () => {
    const origins: unknown[] = [];
    const doc = createBoardDoc();
    doc.on('afterTransaction', (transaction) => {
      origins.push(transaction.origin);
    });
    doc.transact(() => {
      doc.getMap('meta').set('schemaVersion', MODEL_SCHEMA_VERSION);
    }, LOCAL_ORIGIN);
    expect(origins).toContain(LOCAL_ORIGIN);
    doc.destroy();
  });

  test('[T-003-AC1] returns independent documents', () => {
    const first = createBoardDoc();
    const second = createBoardDoc();
    expect(first).not.toBe(second);
    first.getMap('elements').set('a', 1);
    expect(second.getMap('elements').size).toBe(0);
    first.destroy();
    second.destroy();
  });
});
