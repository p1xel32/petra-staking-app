// blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

export default defineConfig({
  site: 'https://aptcore.one',
  base: '/blog',
  trailingSlash: 'never',
  output: 'server', // Важно для адаптера Vercel
  adapter: vercel({
    webAnalytics: { enabled: true }, // Опционально
  }),
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    react()
  ]
});
