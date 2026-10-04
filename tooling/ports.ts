import { createServer } from 'node:net';

/**
 * Reserves a free TCP port by binding to port 0 and releasing it.
 */
export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('Could not allocate a free port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}
