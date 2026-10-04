import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isTestEnv, type ServerConfig } from './config';
import { type BoardDatabase, openDatabase } from './db';
import { createBoard, resetBoards } from './db/boards';

export type BuildAppOptions = {
  config?: ServerConfig;
  logger?: boolean;
  database?: BoardDatabase;
};

const seedSchema = z.object({
  name: z.string().min(1).max(100),
  elements: z.number().int().nonnegative().default(0),
});

function validationError(message: string): { error: { code: string; message: string } } {
  return { error: { code: 'VALIDATION_ERROR', message } };
}

function registerTestRoutes(app: FastifyInstance, db: BoardDatabase): void {
  app.post('/api/test/seed', async (request, reply) => {
    const parsed = seedSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError('Invalid seed payload'));
    }
    const board = createBoard(db, parsed.data.name);
    return reply.code(201).send({ ...board, elementCount: parsed.data.elements });
  });

  app.post('/api/test/reset', async (_request, reply) => {
    resetBoards(db);
    return reply.code(204).send();
  });
}

/**
 * Builds the Fastify application with the HTTP routes of the server.
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
    if (isTestEnv(options.config)) {
      registerTestRoutes(app, db);
    }
  }

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
