import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { notFoundError } from './errors';

const RESERVED_PREFIXES = ['/api', '/collab'];

function isReserved(path: string): boolean {
  return RESERVED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Serves the compiled front-end from `staticDir` and falls back to `index.html`
 * for client-side routes, leaving `/api` and `/collab` untouched (ADR-0010).
 */
export function registerStatic(app: FastifyInstance, staticDir: string): void {
  void app.register(fastifyStatic, { root: staticDir });
  app.setNotFoundHandler((request, reply) => {
    const path = (request.raw.url ?? '/').split('?')[0] ?? '/';
    if (isReserved(path)) {
      return reply.code(404).send(notFoundError('Not found'));
    }
    return reply.sendFile('index.html');
  });
}
