import * as Y from 'yjs';
import { LOCAL_ORIGIN } from './ops';
import { MODEL_SCHEMA_VERSION } from './schema';

export type BoardDoc = Y.Doc;

/**
 * Creates the Yjs document of a board with its shared maps and schema version.
 */
export function createBoardDoc(): BoardDoc {
  const doc = new Y.Doc();
  const meta = doc.getMap<unknown>('meta');
  doc.transact(() => {
    meta.set('schemaVersion', MODEL_SCHEMA_VERSION);
  }, LOCAL_ORIGIN);
  return doc;
}
