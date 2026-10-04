import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestServer, type TestServer } from './helpers/server';

let server: TestServer;
let staticDir: string;

beforeAll(async () => {
  staticDir = mkdtempSync(join(tmpdir(), 'mozaik-static-'));
  writeFileSync(join(staticDir, 'index.html'), '<!doctype html><div id="root"></div>', 'utf8');
  writeFileSync(join(staticDir, 'app.js'), 'console.log("mozaik");', 'utf8');
  server = await startTestServer('production', ':memory:', staticDir);
});

afterAll(async () => {
  await server.close();
  rmSync(staticDir, { recursive: true, force: true });
});

describe('[T-005-AC2] packaged static serving', () => {
  test('[T-005-AC2] serves index.html for a client-side board route', async () => {
    const response = await fetch(`${server.baseUrl}/b/abc123`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    await expect(response.text()).resolves.toContain('<div id="root">');
  });

  test('[T-005-AC2] serves static assets and the API on the same server', async () => {
    const asset = await fetch(`${server.baseUrl}/app.js`);
    expect(asset.status).toBe(200);
    await expect(asset.text()).resolves.toContain('mozaik');

    const health = await fetch(`${server.baseUrl}/api/health`);
    expect(health.status).toBe(200);
  });

  test('[T-005-AC2] keeps an unknown API route as a JSON 404', async () => {
    const response = await fetch(`${server.baseUrl}/api/unknown`);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
