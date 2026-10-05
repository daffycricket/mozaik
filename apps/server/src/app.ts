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
  mixed: z.boolean().default(false),
});

const SEED_GRID_COLUMNS = 10;
const SEED_GRID_STEP = 120;
const SEED_MIXED_TYPES = ['sticky', 'rect', 'ellipse', 'text', 'arrow'] as const;

function seedElement(
  doc: Y.Doc,
  type: (typeof SEED_MIXED_TYPES)[number],
  index: number,
  x: number,
  y: number,
): void {
  const options = { id: nanoid(), createdBy: 'seed' };
  switch (type) {
    case 'sticky':
      createElement(
        doc,
        { type: 'sticky', x, y, width: 100, height: 100, text: `#${index + 1}` },
        options,
      );
      return;
    case 'rect':
    case 'ellipse':
      createElement(doc, { type, x, y, width: 100, height: 80 }, options);
      return;
    case 'text':
      createElement(
        doc,
        { type: 'text', x, y, width: 100, height: 40, text: `Text ${index + 1}` },
        options,
      );
      return;
    case 'arrow':
      createElement(doc, { type: 'arrow', x1: x, y1: y, x2: x + 100, y2: y + 80 }, options);
      return;
  }
}

function seedDocument(db: BoardDatabase, boardId: string, elements: number, mixed: boolean): void {
  const doc = createBoardDoc();
  for (let index = 0; index < elements; index += 1) {
    const x = (index % SEED_GRID_COLUMNS) * SEED_GRID_STEP;
    const y = Math.floor(index / SEED_GRID_COLUMNS) * SEED_GRID_STEP;
    const type = mixed ? (SEED_MIXED_TYPES[index % SEED_MIXED_TYPES.length] ?? 'sticky') : 'sticky';
    seedElement(doc, type, index, x, y);
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
    seedDocument(db, board.id, parsed.data.elements, parsed.data.mixed);
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
