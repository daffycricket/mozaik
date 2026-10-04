import { Database } from '@hocuspocus/extension-database';
import { Hocuspocus, type WebSocketLike } from '@hocuspocus/server';
import nodeAdapter from 'crossws/adapters/node';
import type { FastifyInstance } from 'fastify';
import type { BoardDatabase } from '../db';
import { boardExists } from '../db/boards';
import { loadDocumentState, storeDocumentState } from '../db/documents';

export const COLLAB_PATH = '/collab';

export type CollabServer = {
  closeBoard: (boardId: string) => void;
};

/**
 * Mounts the Hocuspocus collaboration server on the Fastify HTTP server, at `/collab`.
 * Documents are persisted in SQLite and unknown boards are refused.
 */
export function registerCollab(app: FastifyInstance, db: BoardDatabase): CollabServer {
  const hocuspocus = new Hocuspocus({
    quiet: true,
    extensions: [
      new Database({
        fetch: async ({ documentName }) => loadDocumentState(db, documentName),
        store: async ({ documentName, state }) => {
          storeDocumentState(db, documentName, state);
        },
      }),
    ],
    onAuthenticate: async ({ documentName }) => {
      if (!boardExists(db, documentName)) {
        throw new Error(`Board "${documentName}" does not exist`);
      }
    },
  });

  const connections = new WeakMap<object, ReturnType<Hocuspocus['handleConnection']>>();
  const adapter = nodeAdapter({
    hooks: {
      open: (peer) => {
        connections.set(
          peer,
          hocuspocus.handleConnection(peer.websocket as WebSocketLike, peer.request),
        );
      },
      message: (peer, message) => {
        connections.get(peer)?.handleMessage(message.uint8Array());
      },
      close: (peer, details) => {
        connections
          .get(peer)
          ?.handleClose({ code: details.code ?? 1000, reason: details.reason ?? '' });
        connections.delete(peer);
      },
      error: (_peer, error) => {
        app.log.error({ err: error }, 'collab websocket error');
      },
    },
  });

  app.server.on('upgrade', (request, socket, head) => {
    if (request.url !== undefined && request.url.split('?')[0] === COLLAB_PATH) {
      void adapter.handleUpgrade(request, socket, head);
    } else {
      socket.destroy();
    }
  });

  app.addHook('onClose', async () => {
    hocuspocus.flushPendingStores();
    await adapter.close();
  });

  return {
    closeBoard: (boardId) => {
      hocuspocus.closeConnections(boardId);
    },
  };
}
