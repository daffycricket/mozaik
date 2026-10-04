import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import type { ServerConfig } from '../../src/config';
import { type BoardDatabase, openDatabase } from '../../src/db';

export type TestServer = {
  app: FastifyInstance;
  baseUrl: string;
  db: BoardDatabase;
  close: () => Promise<void>;
};

/**
 * Starts the real Fastify server on a free port with an in-memory SQLite database.
 */
export async function startTestServer(
  nodeEnv: ServerConfig['nodeEnv'] = 'test',
): Promise<TestServer> {
  const config: ServerConfig = {
    port: 0,
    databasePath: ':memory:',
    staticDir: undefined,
    nodeEnv,
  };
  const db = openDatabase(':memory:');
  const app = buildApp({ config, database: db });
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Test server did not bind to a TCP port');
  }
  return {
    app,
    db,
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
    close: async () => {
      await app.close();
      db.close();
    },
  };
}
