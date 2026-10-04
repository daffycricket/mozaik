import { buildApp } from './app';
import { loadConfig, type ServerConfig } from './config';

let config: ServerConfig;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const app = buildApp({ config, logger: true });

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

async function shutdown(): Promise<void> {
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
