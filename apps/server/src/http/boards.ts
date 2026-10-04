import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { BoardDatabase } from '../db';
import { createBoard } from '../db/boards';
import { validationError } from './errors';

const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

/**
 * Registers the board REST routes on the application.
 */
export function registerBoardRoutes(app: FastifyInstance, db: BoardDatabase): void {
  app.post('/api/boards', async (request, reply) => {
    const parsed = createBoardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError('Invalid board name'));
    }
    const board = createBoard(db, parsed.data.name);
    return reply.code(201).send(board);
  });
}
