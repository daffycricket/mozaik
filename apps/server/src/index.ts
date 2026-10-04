import { buildApp } from './app';

const DEFAULT_PORT = 3001;

function readPort(): number {
  const rawPort = process.env.PORT;
  if (rawPort === undefined) {
    return DEFAULT_PORT;
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${rawPort}`);
  }
  return port;
}

const app = buildApp({ logger: true });

try {
  await app.listen({ port: readPort(), host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
