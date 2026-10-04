import { HocuspocusProvider } from '@hocuspocus/provider';
import { createBoardDoc, createElement, getElements } from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

const jsonHeaders = { 'content-type': 'application/json' };

const servers: TestServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

async function startServer(): Promise<TestServer> {
  const server = await startTestServer('test');
  servers.push(server);
  return server;
}

async function createBoard(server: TestServer): Promise<string> {
  const response = await fetch(`${server.baseUrl}/api/boards`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name: 'Rétro S12' }),
  });
  const board = (await response.json()) as { id: string };
  return board.id;
}

function collabUrl(server: TestServer): string {
  return `${server.baseUrl.replace('http', 'ws')}/collab`;
}

function waitForEvent(
  provider: HocuspocusProvider,
  event: string,
  timeoutMs = 8000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      provider.off(event, handler);
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeoutMs);
    function handler(payload: unknown): void {
      clearTimeout(timer);
      provider.off(event, handler);
      resolve(payload);
    }
    provider.on(event, handler);
  });
}

function count(db: TestServer['db'], table: string, column: string, value: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ?`)
    .get(value) as {
    count: number;
  };
  return row.count;
}

describe('[T-003-AC2] collaborative persistence', () => {
  test('[T-003-AC2] stores the board state in SQLite and reloads it for a new client', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);

    const doc = createBoardDoc();
    const provider = new HocuspocusProvider({
      url: collabUrl(server),
      name: boardId,
      document: doc,
    });
    await waitForEvent(provider, 'synced');

    createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 100, height: 80, text: 'Bonjour' },
      { id: 'element-1', createdBy: 'user-1' },
    );

    provider.destroy();
    await expect.poll(() => count(server.db, 'documents', 'name', boardId)).toBe(1);

    const reloaded = createBoardDoc();
    const secondProvider = new HocuspocusProvider({
      url: collabUrl(server),
      name: boardId,
      document: reloaded,
    });
    await waitForEvent(secondProvider, 'synced');
    await expect.poll(() => getElements(reloaded).length).toBe(1);
    expect(getElements(reloaded)[0]).toMatchObject({ id: 'element-1', text: 'Bonjour' });

    secondProvider.destroy();
    doc.destroy();
    reloaded.destroy();
  });

  test('[T-003-AC2] refuses a document whose board does not exist', async () => {
    const server = await startServer();
    const doc = createBoardDoc();
    const provider = new HocuspocusProvider({
      url: collabUrl(server),
      name: 'unknown-board',
      document: doc,
    });

    const failure = await waitForEvent(provider, 'authenticationFailed');
    expect(failure).toMatchObject({ reason: expect.any(String) });
    expect(count(server.db, 'documents', 'name', 'unknown-board')).toBe(0);

    provider.destroy();
    doc.destroy();
  });

  test('[T-003-AC2] refuses a websocket upgrade outside the collaboration path', async () => {
    const server = await startServer();
    const socket = new WebSocket(`${server.baseUrl.replace('http', 'ws')}/other`);
    await new Promise<void>((resolve) => {
      socket.onclose = () => resolve();
      socket.onerror = () => resolve();
    });
    expect(socket.readyState).toBe(WebSocket.CLOSED);
  });
});

describe('[T-003-AC5] board deletion', () => {
  test('[T-003-AC5] returns 404 when the board to delete does not exist', async () => {
    const server = await startServer();
    const response = await fetch(`${server.baseUrl}/api/boards/unknown-board`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });

  test('[T-003-AC5] closes the connections when the board is deleted', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);
    const doc = createBoardDoc();
    const provider = new HocuspocusProvider({
      url: collabUrl(server),
      name: boardId,
      document: doc,
    });
    await waitForEvent(provider, 'synced');

    const closed = waitForEvent(provider, 'close');
    const response = await fetch(`${server.baseUrl}/api/boards/${boardId}`, { method: 'DELETE' });
    expect(response.status).toBe(204);
    await closed;

    expect(count(server.db, 'boards', 'id', boardId)).toBe(0);
    expect(count(server.db, 'documents', 'name', boardId)).toBe(0);

    provider.destroy();
    doc.destroy();
  });
});
