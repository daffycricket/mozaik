import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { CollabServer } from '../collab/server';
import type { BoardDatabase } from '../db';
import { createBoard, deleteBoard, getBoard, listBoards } from '../db/boards';
import { notFoundError, validationError } from './errors';

const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

const boardParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * Registers the board REST routes on the application.
 */
export function registerBoardRoutes(
  app: FastifyInstance,
  db: BoardDatabase,
  collab: CollabServer,
): void {
  app.get('/api/boards', async () => listBoards(db));

  app.get('/api/boards/:id', async (request, reply) => {
    const parsed = boardParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(404).send(notFoundError('Board not found'));
    }
    const board = getBoard(db, parsed.data.id);
    if (board === null) {
      return reply.code(404).send(notFoundError('Board not found'));
    }
    return board;
  });

  app.post('/api/boards', async (request, reply) => {
    const parsed = createBoardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError('Invalid board name'));
    }
    const board = createBoard(db, parsed.data.name);
    return reply.code(201).send(board);
  });

  app.delete('/api/boards/:id', async (request, reply) => {
    const parsed = boardParamsSchema.safeParse(request.params);
    if (!parsed.success || !deleteBoard(db, parsed.data.id)) {
      return reply.code(404).send(notFoundError('Board not found'));
    }
    collab.closeBoard(parsed.data.id);
    return reply.code(204).send();
  });
}
