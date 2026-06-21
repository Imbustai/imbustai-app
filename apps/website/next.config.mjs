//@ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nxNext from '@nx/next';

const { composePlugins, withNx } = nxNext;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  transpilePackages: ['@imbustai/i18n', '@imbustai/story-engine'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
