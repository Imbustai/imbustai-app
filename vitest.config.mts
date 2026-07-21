import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tryoutRoot = resolve(__dirname, 'apps/tryout-01');
const websiteRoot = resolve(__dirname, 'apps/website');

function atAliasPlugin() {
  return {
    name: 'at-alias-per-app',
    resolveId(source: string, importer: string | undefined) {
      if (!source.startsWith('@/') || !importer) return null;
      const root = importer.includes('/apps/website/') ? websiteRoot : tryoutRoot;
      return this.resolve(resolve(root, source.slice(2)), importer, {
        skipSelf: true,
      });
    },
  };
}

export default defineConfig({
  plugins: [vanillaExtractPlugin(), react(), atAliasPlugin()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'apps/**/__tests__/**/*.test.ts',
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    pool: 'forks',
  },
});
