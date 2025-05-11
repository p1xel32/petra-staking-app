// blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react"; // If you plan to use React components

// https://astro.build/config
export default defineConfig({
  site: 'https://aptcore.one', // Your main domain
  base: '/blog',               // The subpath for your blog
  trailingSlash: 'always',     // important for paths
  output: 'static',            // ← вот здесь нужна была запятая
  integrations: [
    mdx(),
    tailwind({
      // We apply base styles via global.css and layout files
      applyBaseStyles: false, 
    }),
    sitemap(),
    react() 
  ]
});
