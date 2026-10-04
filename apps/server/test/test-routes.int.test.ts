import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

const seedBody = JSON.stringify({ name: 'Rétro S12', elements: 5 });
const jsonHeaders = { 'content-type': 'application/json' };

describe('[T-002-AC7] test-only routes', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('test');
  });

  afterAll(async () => {
    await server.close();
  });

  test('[T-002-AC7] seeds a board and resets the database in the test environment', async () => {
    const seeded = await fetch(`${server.baseUrl}/api/test/seed`, {
      method: 'POST',
      headers: jsonHeaders,
      body: seedBody,
    });
    expect(seeded.status).toBe(201);
    const board = (await seeded.json()) as { id: string; name: string; elementCount: number };
    expect(board.name).toBe('Rétro S12');
    expect(board.id).toHaveLength(12);
    expect(board.elementCount).toBe(5);

    const rejected = await fetch(`${server.baseUrl}/api/test/seed`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: '', elements: -1 }),
    });
    expect(rejected.status).toBe(400);

    const reset = await fetch(`${server.baseUrl}/api/test/reset`, { method: 'POST' });
    expect(reset.status).toBe(204);
  });
});

describe('[T-002-AC7] test-only routes outside the test environment', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer('development');
  });

  afterAll(async () => {
    await server.close();
  });

  test('[T-002-AC7] does not expose the test routes outside the test environment', async () => {
    const seed = await fetch(`${server.baseUrl}/api/test/seed`, {
      method: 'POST',
      headers: jsonHeaders,
      body: seedBody,
    });
    expect(seed.status).toBe(404);
    const reset = await fetch(`${server.baseUrl}/api/test/reset`, { method: 'POST' });
    expect(reset.status).toBe(404);
  });
});
