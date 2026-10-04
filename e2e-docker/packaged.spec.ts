import { expect, test } from '@playwright/test';
import { storedIdentityState } from '../e2e/support/identity';
import { compose, waitForHealth } from './support/compose';

const BASE_URL = process.env.MOZAIK_DOCKER_BASE_URL ?? 'http://127.0.0.1:8080';

type Board = { id: string; updatedAt: string };

async function createBoard(name: string): Promise<Board> {
  const response = await fetch(`${BASE_URL}/api/boards`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Board;
}

function documentStateSize(boardId: string): number {
  const script = [
    "const Database = require('better-sqlite3');",
    "const db = new Database('/data/board.sqlite');",
    "const row = db.prepare('SELECT length(state) AS size FROM documents WHERE name = ?').get(",
    `'${boardId}');`,
    'process.stdout.write(String(row ? row.size : 0));',
  ].join('');
  return Number(compose('exec', '-T', 'app', 'node', '-e', script).trim());
}

test('[T-005-AC1] serves the board menu with a green healthcheck', async ({ page }) => {
  const health = await fetch(`${BASE_URL}/api/health`);
  expect(health.status).toBe(200);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible();
});

test('[T-005-AC2] opens a direct board URL in a fresh browser context', async ({ browser }) => {
  const board = await createBoard(`Board direct ${Date.now()}`);
  const context = await browser.newContext({ storageState: storedIdentityState(BASE_URL) });
  const page = await context.newPage();
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await context.close();
});

test('[T-005-AC4] publishes the port only on 127.0.0.1', () => {
  const binding = compose('port', 'app', '3001').trim();
  expect(binding.startsWith('127.0.0.1:')).toBe(true);
});

test('[T-005-AC3] keeps the board document across down and up', async ({ browser }) => {
  const board = await createBoard(`Board persistant ${Date.now()}`);
  const context = await browser.newContext({ storageState: storedIdentityState(BASE_URL) });
  const page = await context.newPage();
  await page.goto(`/b/${board.id}`);
  await expect(page.getByTestId('board-canvas').locator('canvas')).toBeVisible();

  const box = await page.getByTestId('board-canvas').boundingBox();
  if (box === null) {
    throw new Error('Expected the canvas to have a bounding box');
  }
  await page.keyboard.press('n');
  await page.mouse.click(box.x + 300, box.y + 250);

  await expect
    .poll(
      async () => {
        const response = await fetch(`${BASE_URL}/api/boards/${board.id}`);
        const current = (await response.json()) as Board;
        return current.updatedAt > board.updatedAt;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  const persistedSize = documentStateSize(board.id);
  expect(persistedSize).toBeGreaterThan(0);

  compose('down');
  compose('up', '-d');
  await waitForHealth(BASE_URL);

  const after = await fetch(`${BASE_URL}/api/boards/${board.id}`);
  expect(after.status).toBe(200);
  expect(documentStateSize(board.id)).toBeGreaterThan(0);

  const reopened = await browser.newContext({ storageState: storedIdentityState(BASE_URL) });
  const reopenedPage = await reopened.newPage();
  await reopenedPage.goto(`/b/${board.id}`);
  await expect(reopenedPage.getByTestId('board-canvas').locator('canvas')).toBeVisible();
  await reopened.close();
  await context.close();
});
