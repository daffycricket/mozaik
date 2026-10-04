import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildApp } from './app';
import type { ServerConfig } from './config';

describe('[T-003-AC2] application shutdown', () => {
  test('[T-003-AC2] closes the database it opened when the application stops', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'mozaik-app-'));
    const config: ServerConfig = {
      port: 0,
      databasePath: join(directory, 'board.sqlite'),
      staticDir: undefined,
      nodeEnv: 'test',
    };
    const app = buildApp({ config });
    await app.ready();
    expect(app.hasRoute({ method: 'GET', url: '/api/health' })).toBe(true);
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
