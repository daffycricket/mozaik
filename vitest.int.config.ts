import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.int.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/e2e-docker/**'],
    reporters: ['default', ['json', { outputFile: 'coverage/vitest-int-results.json' }]],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
