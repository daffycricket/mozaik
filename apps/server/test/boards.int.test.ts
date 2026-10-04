import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

const jsonHeaders = { 'content-type': 'application/json' };

type BoardBody = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

describe('[F01-S1-AC2] board creation API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('test');
  });

  afterAll(async () => {
    await server.close();
  });

  test('[F01-S1-AC2] creates a board and returns its metadata', async () => {
    const response = await fetch(`${server.baseUrl}/api/boards`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Rétro S12' }),
    });

    expect(response.status).toBe(201);
    const board = (await response.json()) as BoardBody;
    expect(board.id).toHaveLength(12);
    expect(board.name).toBe('Rétro S12');
    expect(new Date(board.createdAt).toString()).not.toBe('Invalid Date');
    expect(new Date(board.updatedAt).toString()).not.toBe('Invalid Date');
  });

  test('[F01-S1-AC2] trims the surrounding spaces of the board name', async () => {
    const response = await fetch(`${server.baseUrl}/api/boards`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: '  Rétro S12  ' }),
    });

    expect(response.status).toBe(201);
    const board = (await response.json()) as BoardBody;
    expect(board.name).toBe('Rétro S12');
  });
});

describe('[F01-S1-AC3] board name validation', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('test');
  });

  afterAll(async () => {
    await server.close();
  });

  async function postName(name: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${server.baseUrl}/api/boards`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name }),
    });
    return { status: response.status, body: await response.json() };
  }

  test('[F01-S1-AC3] rejects an empty or whitespace-only board name', async () => {
    for (const name of ['', '   ']) {
      const { status, body } = await postName(name);
      expect(status).toBe(400);
      expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    }
  });

  test('[F01-S1-AC3] rejects a board name longer than 100 characters', async () => {
    const { status, body } = await postName('a'.repeat(101));
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});
