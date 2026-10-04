import { describe, expect, test } from 'vitest';
import { loadConfig } from './config';

describe('[T-002-AC7] server configuration', () => {
  test('[T-002-AC7] applies the defaults when the environment is empty', () => {
    const config = loadConfig({});
    expect(config.port).toBe(3001);
    expect(config.databasePath).toBe('./data/board.sqlite');
    expect(config.nodeEnv).toBe('development');
    expect(config.staticDir).toBeUndefined();
  });

  test('[T-002-AC7] reads the provided values', () => {
    const config = loadConfig({
      PORT: '4123',
      DATABASE_PATH: ':memory:',
      STATIC_DIR: '/srv/web',
      NODE_ENV: 'test',
    });
    expect(config).toEqual({
      port: 4123,
      databasePath: ':memory:',
      staticDir: '/srv/web',
      nodeEnv: 'test',
    });
  });

  test('[T-002-AC7] rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: 'not-a-port' })).toThrow(/Invalid server configuration/);
  });

  test('[T-002-AC7] rejects an unknown node environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(/Invalid server configuration/);
  });
});
