import { defineConfig } from 'vitest/config';

export default defineConfig({
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
