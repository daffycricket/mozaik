import Fastify, { type FastifyInstance } from 'fastify';

export type BuildAppOptions = {
  logger?: boolean;
};

/**
 * Builds the Fastify application with the HTTP routes of the server.
 */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
