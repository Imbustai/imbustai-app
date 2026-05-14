import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/tryout-01'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'apps/**/__tests__/**/*.test.ts',
      'apps/**/*.test.ts',
      'packages/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    pool: 'forks',
  },
});
