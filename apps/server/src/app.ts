import { createBoardDoc, createElement } from '@mozaik/model';
import Fastify, { type FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';
import { z } from 'zod';
import { registerCollab } from './collab/server';
import { isTestEnv, type ServerConfig } from './config';
import { type BoardDatabase, openDatabase } from './db';
import { createBoard, resetBoards } from './db/boards';
import { storeDocumentState } from './db/documents';
import { registerBoardRoutes } from './http/boards';
import { validationError } from './http/errors';
import { registerStatic } from './http/static';

export type BuildAppOptions = {
  config?: ServerConfig;
  logger?: boolean;
  database?: BoardDatabase;
};

const seedSchema = z.object({
  name: z.string().min(1).max(100),
  elements: z.number().int().nonnegative().default(0),
});

const SEED_GRID_STEP = 120;

function seedDocument(db: BoardDatabase, boardId: string, elements: number): void {
  const doc = createBoardDoc();
  for (let index = 0; index < elements; index += 1) {
    createElement(
      doc,
      {
        type: 'sticky',
        x: (index % 10) * SEED_GRID_STEP,
        y: Math.floor(index / 10) * SEED_GRID_STEP,
        width: 100,
        height: 100,
        text: `#${index + 1}`,
      },
      { id: nanoid(), createdBy: 'seed' },
    );
  }
  storeDocumentState(db, boardId, Y.encodeStateAsUpdate(doc));
  doc.destroy();
}

function registerTestRoutes(app: FastifyInstance, db: BoardDatabase): void {
  app.post('/api/test/seed', async (request, reply) => {
    const parsed = seedSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError('Invalid seed payload'));
    }
    const board = createBoard(db, parsed.data.name);
    seedDocument(db, board.id, parsed.data.elements);
    return reply.code(201).send({ ...board, elementCount: parsed.data.elements });
  });

  app.post('/api/test/reset', async (_request, reply) => {
    resetBoards(db);
    return reply.code(204).send();
  });
}

/**
 * Builds the Fastify application with the HTTP and collaboration routes of the server.
 * Test-only routes are registered when the configuration targets the test environment.
 */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  if (options.config !== undefined) {
    const db = options.database ?? openDatabase(options.config.databasePath);
    if (options.database === undefined) {
      app.addHook('onClose', async () => {
        db.close();
      });
    }
    const collab = registerCollab(app, db);
    registerBoardRoutes(app, db, collab);
    if (options.config.staticDir !== undefined) {
      registerStatic(app, options.config.staticDir);
    }
    if (isTestEnv(options.config)) {
      registerTestRoutes(app, db);
    }
  }

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
