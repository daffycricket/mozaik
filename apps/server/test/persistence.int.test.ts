import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { createBoardDoc, createElement, getElements } from '@mozaik/model';
import { afterEach, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

const jsonHeaders = { 'content-type': 'application/json' };

const servers: TestServer[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

async function startServer(databasePath?: string): Promise<TestServer> {
  const server = await startTestServer('test', databasePath);
  servers.push(server);
  return server;
}

async function createBoard(server: TestServer, name = 'Persistance'): Promise<string> {
  const response = await fetch(`${server.baseUrl}/api/boards`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
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

function fileDatabase(): string {
  const directory = mkdtempSync(join(tmpdir(), 'mozaik-persist-'));
  directories.push(directory);
  return join(directory, 'board.sqlite');
}

describe('[F09-S2-AC2] server restart', () => {
  test('[F09-S2-AC2] serves the stored state to a new client after a restart', async () => {
    const databasePath = fileDatabase();

    const first = await startServer(databasePath);
    const boardId = await createBoard(first);
    const doc = createBoardDoc();
    const provider = new HocuspocusProvider({
      url: collabUrl(first),
      name: boardId,
      document: doc,
    });
    await waitForEvent(provider, 'synced');
    createElement(
      doc,
      { type: 'sticky', x: 10, y: 20, width: 100, height: 80, text: 'Survivant' },
      { id: 'persisted-1', createdBy: 'user-1' },
    );
    provider.destroy();
    doc.destroy();
    await expect
      .poll(
        () =>
          (
            first.db.prepare('SELECT COUNT(*) AS count FROM documents').get() as {
              count: number;
            }
          ).count,
      )
      .toBe(1);
    await first.close();
    servers.splice(servers.indexOf(first), 1);

    const restarted = await startServer(databasePath);
    const reloaded = createBoardDoc();
    const newProvider = new HocuspocusProvider({
      url: collabUrl(restarted),
      name: boardId,
      document: reloaded,
    });
    await waitForEvent(newProvider, 'synced');
    await expect.poll(() => getElements(reloaded).length).toBe(1);
    expect(getElements(reloaded)[0]).toMatchObject({ id: 'persisted-1', text: 'Survivant' });

    newProvider.destroy();
    reloaded.destroy();
  });
});

describe('[F09-S2-AC3] modification date', () => {
  test('[F09-S2-AC3] updates the board modification date when its content changes', async () => {
    const server = await startServer();
    const boardId = await createBoard(server);
    const created = (await (await fetch(`${server.baseUrl}/api/boards/${boardId}`)).json()) as {
      updatedAt: string;
    };

    const doc = createBoardDoc();
    const provider = new HocuspocusProvider({
      url: collabUrl(server),
      name: boardId,
      document: doc,
    });
    await waitForEvent(provider, 'synced');
    createElement(
      doc,
      { type: 'sticky', x: 0, y: 0, width: 100, height: 100, text: 'Contenu' },
      { id: 'element-1', createdBy: 'user-1' },
    );

    await expect
      .poll(
        async () => {
          const response = await fetch(`${server.baseUrl}/api/boards/${boardId}`);
          const board = (await response.json()) as { updatedAt: string };
          return board.updatedAt > created.updatedAt;
        },
        { timeout: 8000 },
      )
      .toBe(true);

    provider.destroy();
    doc.destroy();
  });
});
