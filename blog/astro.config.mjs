import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

import remarkGfm from 'remark-gfm'; 
import remarkSmartypants from 'remark-smartypants'; 

export default defineConfig({
  site: 'https://aptcore.one',
  base: '/blog',
  trailingSlash: 'never',
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkSmartypants],
      rehypePlugins: [],
    }),
    tailwind(),
    sitemap(),
    react(),
  ],
});
