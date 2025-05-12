// blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap"; // Sitemap will generate root-relative URLs
import react from "@astrojs/react";

export default defineConfig({
  site: 'https://aptcore.one', // Still important for sitemap and OG tags (they should point to the final URL)
  // base: '/blog', // REMOVED or COMMENTED OUT
  trailingSlash: 'never', // Keep if it helps with Vercel
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false, 
    }),
    sitemap(), // This will now generate URLs like /my-post, /about, etc.
    react(),
  ],
});
