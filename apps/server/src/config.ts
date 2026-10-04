import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_PATH: z.string().min(1).default('./data/board.sqlite'),
  STATIC_DIR: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerConfig = {
  port: number;
  databasePath: string;
  staticDir: string | undefined;
  nodeEnv: 'development' | 'test' | 'production';
};

/**
 * Reads and validates the server configuration from the environment.
 * Throws a readable error when a value is invalid so startup can abort.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid server configuration: ${details}`);
  }
  return {
    port: parsed.data.PORT,
    databasePath: parsed.data.DATABASE_PATH,
    staticDir: parsed.data.STATIC_DIR,
    nodeEnv: parsed.data.NODE_ENV,
  };
}

/**
 * Tells whether the server runs in the test environment, where test-only routes are exposed.
 */
export function isTestEnv(config: ServerConfig): boolean {
  return config.nodeEnv === 'test';
}
