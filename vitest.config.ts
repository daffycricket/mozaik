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
    reporters: ['default', ['json', { outputFile: 'coverage/vitest-results.json' }]],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/e2e-docker/**',
      '**/*.int.test.ts',
    ],
  },
});
