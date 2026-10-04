import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.int.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/e2e-docker/**'],
    reporters: ['default', ['json', { outputFile: 'coverage/vitest-cov-results.json' }]],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.ts', 'apps/*/src/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.int.test.ts',
        'apps/web/src/main.tsx',
        // Pure Konva rendering components, covered by the end-to-end tests.
        'apps/web/src/canvas/**',
        'apps/server/src/index.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});
