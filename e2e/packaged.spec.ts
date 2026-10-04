import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { findFreePort } from '../tooling/ports';
import { storedIdentityState } from './support/identity';

const STATIC_DIR = resolve('apps/web/dist');

let server: ChildProcess;
let baseUrl: string;
let databaseDir: string;
let boardId: string;

async function waitForHealth(url: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is not up yet.
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Server at ${url} did not become healthy`);
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  execFileSync('pnpm', ['--filter', '@mozaik/web', 'build'], { stdio: 'inherit' });

  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  databaseDir = mkdtempSync(join(tmpdir(), 'mozaik-packaged-'));
  server = spawn(process.execPath, ['--import', 'tsx', 'apps/server/src/index.ts'], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: join(databaseDir, 'board.sqlite'),
      STATIC_DIR,
      NODE_ENV: 'production',
    },
    stdio: 'ignore',
  });
  await waitForHealth(baseUrl);

  const created = await fetch(`${baseUrl}/api/boards`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Board packagé' }),
  });
  expect(created.status).toBe(201);
  boardId = ((await created.json()) as { id: string }).id;
});

test.afterAll(async () => {
  server?.kill('SIGTERM');
  if (databaseDir !== undefined) {
    rmSync(databaseDir, { recursive: true, force: true });
  }
});

test('[T-005-AC8] serves the menu, a direct board URL and the API from one port', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: storedIdentityState(baseUrl) });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/`);
  await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible();

  await page.goto(`${baseUrl}/b/${boardId}`);
  await expect(page.getByTestId('board-canvas')).toBeAttached();
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();

  const boards = await fetch(`${baseUrl}/api/boards`);
  expect(boards.status).toBe(200);

  await context.close();
});
