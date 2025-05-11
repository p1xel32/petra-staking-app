// blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

export default defineConfig({
  site: 'https://aptcore.one',
  base: '/blog',
  trailingSlash: 'always',
  output: 'static',
  adapter: vercel({ // Add the adapter configuration
    webAnalytics: { enabled: true }, // Optional: if you use Vercel Analytics
    // You can add other Vercel-specific options here if needed
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