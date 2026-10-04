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
 * Starts the real Fastify server on a free port with a SQLite database.
 * The database path defaults to `:memory:` and may point to a file so a test
 * can stop the server and start another one on the same data (F09-S2-AC2).
 */
export async function startTestServer(
  nodeEnv: ServerConfig['nodeEnv'] = 'test',
  databasePath = ':memory:',
  staticDir?: string,
): Promise<TestServer> {
  const config: ServerConfig = {
    port: 0,
    databasePath,
    staticDir,
    nodeEnv,
  };
  const db = openDatabase(databasePath);
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
