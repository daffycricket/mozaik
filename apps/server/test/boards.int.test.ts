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

describe('[F01-S2-AC1] board list API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('test');
  });

  afterAll(async () => {
    await server.close();
  });

  test('[F01-S2-AC1] returns boards sorted by modification date descending', async () => {
    const insert = server.db.prepare(
      'INSERT INTO boards (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    );
    insert.run('older', 'Ancien', '2026-09-28T10:00:00.000Z', '2026-09-28T10:00:00.000Z');
    insert.run('newer', 'Récent', '2026-10-04T10:00:00.000Z', '2026-10-04T10:00:00.000Z');
    insert.run('middle', 'Milieu', '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z');

    const response = await fetch(`${server.baseUrl}/api/boards`);

    expect(response.status).toBe(200);
    const boards = (await response.json()) as BoardBody[];
    expect(boards.map((board) => board.id)).toEqual(['newer', 'middle', 'older']);
  });
});

describe('[F01-S2-AC3] board read API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('test');
  });

  afterAll(async () => {
    await server.close();
  });

  test('returns a board by id and 404 for an unknown board', async () => {
    const created = await fetch(`${server.baseUrl}/api/boards`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Rétro S12' }),
    });
    const board = (await created.json()) as BoardBody;

    const found = await fetch(`${server.baseUrl}/api/boards/${board.id}`);
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual(board);

    const missing = await fetch(`${server.baseUrl}/api/boards/inexistant`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
