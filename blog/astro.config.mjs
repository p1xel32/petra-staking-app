import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig({
  site: 'https://aptcore.one',
  base: '/blog',
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-ES',
          ja: 'ja-JP',
          ko: 'ko-KR',
          ru: 'ru-RU',
          vi: 'vi-VN',
        },
      },
    }),
    react(),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'ja', 'ko', 'ru', 'vi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    define: {
      '__dirname': JSON.stringify(path.dirname(fileURLToPath(import.meta.url))),
    },
    build: {
      rollupOptions: {
        external: ['fsevents'],
      },
    },
  },
});
