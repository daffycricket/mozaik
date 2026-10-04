import { describe, expect, test } from 'vitest';
import { buildApp } from './app';

describe('[T-001-AC2] server health route', () => {
  test('[T-001-AC2] GET /api/health responds 200 with status ok', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});

describe('[T-001-AC5] server package', () => {
  test('[T-001-AC5] builds a ready Fastify application', async () => {
    const app = buildApp();
    await app.ready();
    expect(app.hasRoute({ method: 'GET', url: '/api/health' })).toBe(true);
    await app.close();
  });
});
