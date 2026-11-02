import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://g3qualifiedengineerlondon.co.uk',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
