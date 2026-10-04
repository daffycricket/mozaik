import { HocuspocusProvider } from '@hocuspocus/provider';
import {
  type BoardDoc,
  createBoardDoc,
  createElement,
  deleteElements,
  getElements,
  updateElement,
} from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

type Client = { doc: BoardDoc; provider: HocuspocusProvider };

const jsonHeaders = { 'content-type': 'application/json' };

const servers: TestServer[] = [];
const clients: Client[] = [];

afterEach(async () => {
  for (const client of clients.splice(0)) {
    client.provider.destroy();
    client.doc.destroy();
  }
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
    body: JSON.stringify({ name: 'Synchronisation' }),
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

async function connect(server: TestServer, boardId: string): Promise<Client> {
  const doc = createBoardDoc();
  const provider = new HocuspocusProvider({
    url: collabUrl(server),
    name: boardId,
    document: doc,
  });
  clients.push({ doc, provider });
  await waitForEvent(provider, 'synced');
  return { doc, provider };
}

function createSticky(client: Client, id: string, createdBy: string): void {
  createElement(
    client.doc,
    { type: 'sticky', x: 0, y: 0, width: 200, height: 200 },
    { id, createdBy },
  );
}

describe('[F09-S1-AC1] propagation', () => {
  test('[F09-S1-AC1] propagates creation, update and deletion to a second user', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);
    const user1 = await connect(server, boardId);
    const user2 = await connect(server, boardId);

    createSticky(user1, 's1', 'user-1');
    await expect.poll(() => getElements(user2.doc).length).toBe(1);
    expect(getElements(user2.doc)[0]).toMatchObject({ id: 's1', color: 'yellow' });

    updateElement(user1.doc, 's1', { x: 320, color: 'blue' });
    await expect.poll(() => getElements(user2.doc)[0]?.x).toBe(320);
    await expect
      .poll(() => (getElements(user2.doc)[0] as { color?: string } | undefined)?.color)
      .toBe('blue');

    deleteElements(user1.doc, ['s1']);
    await expect.poll(() => getElements(user2.doc).length).toBe(0);
  });
});

describe('[F09-S1-AC2] concurrent modifications', () => {
  test('[F09-S1-AC2] converges on both the new position and the new colour', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);
    const user1 = await connect(server, boardId);
    const user2 = await connect(server, boardId);

    createSticky(user1, 's1', 'user-1');
    await expect.poll(() => getElements(user2.doc).length).toBe(1);

    updateElement(user1.doc, 's1', { x: 400 });
    updateElement(user2.doc, 's1', { color: 'red' });

    await expect.poll(() => getElements(user1.doc)[0]).toMatchObject({ x: 400, color: 'red' });
    await expect.poll(() => getElements(user2.doc)[0]).toMatchObject({ x: 400, color: 'red' });
  });
});

describe('[F09-S1-AC3] load', () => {
  test('[F09-S1-AC3] converges five clients creating sixty elements each', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);
    const users = await Promise.all([0, 1, 2, 3, 4].map(() => connect(server, boardId)));

    await Promise.all(
      users.map(async (user, index) => {
        for (let element = 0; element < 60; element += 1) {
          createElement(
            user.doc,
            { type: 'sticky', x: element, y: index, width: 50, height: 50 },
            { id: `u${index}-e${element}`, createdBy: `u${index}` },
          );
        }
      }),
    );

    for (const user of users) {
      await expect
        .poll(() => getElements(user.doc).length, { timeout: 20_000, interval: 100 })
        .toBe(300);
      expect(new Set(getElements(user.doc).map((element) => element.id)).size).toBe(300);
    }
  }, 30_000);
});
