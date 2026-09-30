// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Imbustai developer',
      description: 'Build Engines for interactive epistolary Stories.',
      customCss: ['./src/styles/theme.css'],
      plugins: [
        // Both the CLI validation gate and the renderer read typedoc.json.
        starlightTypeDoc({
          output: 'reference',
          sidebar: { label: 'Runtime reference' },
          typeDoc: { entryFileName: 'index' },
        }),
      ],
      sidebar: [
        { label: 'Start here', link: '/' },
        { label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'Engines', link: '/engines/' },
        { label: 'Hooks', link: '/reference/interfaces/engine/' },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
